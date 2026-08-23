jest.mock("./client", () => ({
  apiClient: {
    delete: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

import { apiClient } from "./client";
import {
  computeRoleFailedIds,
  createAdminUser,
  getAdminUsersBatch,
  summarizeBatchEdit,
  updateAdminUsersRole,
} from "./admin";

describe("lib/api/admin batch wrappers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("PUTs the role batch to /admin/users with the request body", () => {
    updateAdminUsersRole({ ids: [1, 2], role: "member" });

    expect(apiClient.put).toHaveBeenCalledWith("/admin/users", {
      ids: [1, 2],
      role: "member",
    });
  });

  it("GETs the batch user query with comma-joined ids", () => {
    getAdminUsersBatch([1, 2, 3]);

    expect(apiClient.get).toHaveBeenCalledWith("/admin/users/batch", {
      params: { ids: "1,2,3" },
    });
  });

  it("threads the response envelope through to the caller", async () => {
    const results = [{ id: 1, success: true, role: "member" }];
    (apiClient.put as jest.Mock).mockResolvedValueOnce({
      data: { code: 0, message: "ok", data: { results } },
    });

    const res = await updateAdminUsersRole({ ids: [1], role: "member" });

    expect(res.data.data.results).toEqual(results);
  });
});

describe("lib/api/admin createAdminUser", () => {
  it("POSTs the provisioning request to /admin/users with the body", () => {
    createAdminUser({
      name: "张三",
      phone_number: "13800138000",
      qq_number: "12345",
      student_id: "B24040525",
      login_email: "b24040525@njupt.edu.cn",
    });

    expect(apiClient.post).toHaveBeenCalledWith("/admin/users", {
      name: "张三",
      phone_number: "13800138000",
      qq_number: "12345",
      student_id: "B24040525",
      login_email: "b24040525@njupt.edu.cn",
    });
  });

  it("threads the one-time initial_password through the envelope", async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: {
        code: 0,
        message: "ok",
        data: {
          id: 2001,
          login_email: "b24040525@njupt.edu.cn",
          // Placeholder, not a real password — low-entropy so secret scanners
          // (GitGuardian Generic Password) don't flag the fixture.
          initial_password: "initial-password-placeholder",
        },
      },
    });

    const res = await createAdminUser({
      name: "张三",
      phone_number: "13800138000",
      qq_number: "12345",
      student_id: "B24040525",
      login_email: "b24040525@njupt.edu.cn",
    });

    expect(res.data.data.initial_password).toBe("initial-password-placeholder");
  });
});

describe("computeRoleFailedIds", () => {
  it("returns an empty set when role was not part of the edit", () => {
    expect(computeRoleFailedIds([1, 2], null)).toEqual(new Set());
  });

  it("marks only failed ids as role-failed", () => {
    const failed = computeRoleFailedIds(
      [1, 2, 3],
      [
        { id: 1, success: true, role: "member" },
        { id: 2, success: false, reason: "用户不存在" },
        { id: 3, success: true, role: "member" },
      ],
    );

    expect([...failed]).toEqual([2]);
  });

  it("treats ids missing from the results as failed", () => {
    const failed = computeRoleFailedIds(
      [1, 2, 3],
      [
        { id: 1, success: true, role: "member" },
        { id: 2, success: true, role: "member" },
      ],
    );

    expect([...failed]).toEqual([3]);
  });
});

describe("summarizeBatchEdit", () => {
  it("counts a fully successful role batch", () => {
    const summary = summarizeBatchEdit({
      ids: [1, 2],
      roleResults: [
        { id: 1, success: true, role: "member" },
        { id: 2, success: true, role: "member" },
      ],
      singleUpdateFailures: new Map(),
    });

    expect(summary).toEqual({ successCount: 2, failedIds: [], reasons: [] });
  });

  it("keeps backend reasons for role failures", () => {
    const summary = summarizeBatchEdit({
      ids: [1, 2, 3],
      roleResults: [
        { id: 1, success: true, role: "member" },
        { id: 2, success: false, reason: "用户不存在" },
        { id: 3, success: false, reason: "系统中至少需要保留一名管理员" },
      ],
      singleUpdateFailures: new Map(),
    });

    expect(summary.successCount).toBe(1);
    expect(summary.failedIds).toEqual([2, 3]);
    expect(summary.reasons).toEqual(["用户不存在", "系统中至少需要保留一名管理员"]);
  });

  it("counts a role-success + single-update failure once per user", () => {
    const summary = summarizeBatchEdit({
      ids: [1, 2, 3],
      roleResults: [
        { id: 1, success: true, role: "member" },
        { id: 2, success: true, role: "member" },
        { id: 3, success: true, role: "member" },
      ],
      singleUpdateFailures: new Map([
        [2, "department 校验失败"],
        [3, "department 校验失败"],
      ]),
    });

    expect(summary.successCount).toBe(1);
    expect(summary.failedIds).toEqual([2, 3]);
  });

  it("dedupes reasons in first-failure order", () => {
    const summary = summarizeBatchEdit({
      ids: [1, 2, 3],
      roleResults: [
        { id: 1, success: false, reason: "用户不存在" },
        { id: 2, success: false, reason: "用户已注销，请先恢复后再编辑" },
        { id: 3, success: false, reason: "用户不存在" },
      ],
      singleUpdateFailures: new Map(),
    });

    expect(summary.reasons).toEqual(["用户不存在", "用户已注销，请先恢复后再编辑"]);
  });

  it("reports ids missing from role results as failed with a placeholder reason", () => {
    const summary = summarizeBatchEdit({
      ids: [1, 2],
      roleResults: [{ id: 1, success: true, role: "member" }],
      singleUpdateFailures: new Map(),
    });

    expect(summary.successCount).toBe(1);
    expect(summary.failedIds).toEqual([2]);
    expect(summary.reasons).toEqual(["服务器未返回处理结果"]);
  });

  it("treats a request-level role failure shape as fully failed", () => {
    const reason = "用户 id 必须为正整数";
    const summary = summarizeBatchEdit({
      ids: [1, 2],
      roleResults: [
        { id: 1, success: false, reason },
        { id: 2, success: false, reason },
      ],
      singleUpdateFailures: new Map(),
    });

    expect(summary.successCount).toBe(0);
    expect(summary.failedIds).toEqual([1, 2]);
    expect(summary.reasons).toEqual([reason]);
  });
});
