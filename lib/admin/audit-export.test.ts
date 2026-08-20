jest.mock("@/lib/api/admin", () => ({
  getAdminAuditLogs: jest.fn(),
}));

import { getAdminAuditLogs } from "@/lib/api/admin";
import type { AdminAuditLog } from "@/lib/api/types";
import {
  AUDIT_EXPORT_MAX_ROWS,
  AUDIT_EXPORT_PAGE_SIZE,
  buildAuditExportFilename,
  fetchAllAuditLogs,
  formatAuditLogsJson,
} from "./audit-export";

const mockGet = getAdminAuditLogs as jest.MockedFunction<typeof getAdminAuditLogs>;

function log(overrides: Partial<AdminAuditLog> = {}): AdminAuditLog {
  return {
    id: 1,
    user_id: 123,
    user_name: "张三",
    action: "login",
    resource: "user",
    resource_id: "42",
    detail: { method: "password", login_email: "a@b.com" },
    client_ip: "192.168.1.1",
    user_agent: "Mozilla/5.0",
    success: true,
    err_code: null,
    created_at: "2025-06-01T10:30:00",
    ...overrides,
  };
}

function mockPage(logs: AdminAuditLog[], total: number, page = 1) {
  mockGet.mockResolvedValueOnce({
    data: {
      data: { logs, total, page, page_size: AUDIT_EXPORT_PAGE_SIZE },
    },
  } as never);
}

describe("formatAuditLogsJson", () => {
  it("serializes the raw log metadata array as a JSON document", () => {
    const logs = [log(), log({ id: 2, success: false, err_code: -1001, detail: null })];
    const json = formatAuditLogsJson(logs);

    expect(json.startsWith("[")).toBe(true);
    expect(json.endsWith("]")).toBe(true);
    expect(JSON.parse(json)).toEqual(logs);
  });

  it("keeps the original field values verbatim (no label mapping or summaries)", () => {
    const raw = fsLogsSample();
    const json = formatAuditLogsJson(raw);

    expect(json).not.toContain("登录"); // 不渲染中文操作标签
    expect(JSON.parse(json)).toEqual(raw); // 字段原样传输
  });

  it("handles an empty export", () => {
    expect(JSON.parse(formatAuditLogsJson([]))).toEqual([]);
  });
});

// 独立的原始字段样本，校验导出不做任何字段改写/翻译
function fsLogsSample(): AdminAuditLog[] {
  return [
    {
      id: 1,
      user_id: 2,
      user_name: "Admin",
      action: "login",
      resource: "user",
      resource_id: "10",
      detail: { method: "password" },
      client_ip: "10.0.0.1",
      user_agent: "Mozilla/5.0",
      success: true,
      err_code: null,
      created_at: "2026-01-01T12:00:00.000Z",
    },
  ];
}

describe("fetchAllAuditLogs", () => {
  // resetAllMocks 会同时清掉 mockResolvedValueOnce 队列，避免用例间泄漏
  beforeEach(() => jest.resetAllMocks());

  it("returns logs from a single page", async () => {
    const logs = [log(), log({ id: 2 })];
    mockPage(logs, 2);

    const result = await fetchAllAuditLogs({ action: "login" });

    expect(result).toEqual(logs);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith({
      action: "login",
      page: 1,
      page_size: AUDIT_EXPORT_PAGE_SIZE,
    });
  });

  it("paginates until total is reached", async () => {
    const pageA = Array.from({ length: AUDIT_EXPORT_PAGE_SIZE }, (_, i) =>
      log({ id: i + 1 }),
    );
    const pageB = [log({ id: 999 })];
    mockPage(pageA, AUDIT_EXPORT_PAGE_SIZE + 1);
    mockPage(pageB, AUDIT_EXPORT_PAGE_SIZE + 1, 2);

    const result = await fetchAllAuditLogs({});

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenNthCalledWith(2, {
      page: 2,
      page_size: AUDIT_EXPORT_PAGE_SIZE,
    });
    expect(result).toHaveLength(AUDIT_EXPORT_PAGE_SIZE + 1);
  });

  it("stops early on a short page", async () => {
    const pageA = Array.from({ length: 10 }, (_, i) => log({ id: i + 1 }));
    mockPage(pageA, 500); // total says 500 but page only returns 10

    const result = await fetchAllAuditLogs({});

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(10);
  });

  it("caps output at AUDIT_EXPORT_MAX_ROWS", async () => {
    const fullPage = Array.from({ length: AUDIT_EXPORT_PAGE_SIZE }, (_, i) =>
      log({ id: i + 1 }),
    );
    mockGet.mockResolvedValue({
      data: {
        data: {
          logs: fullPage,
          total: Number.MAX_SAFE_INTEGER,
          page: 1,
          page_size: AUDIT_EXPORT_PAGE_SIZE,
        },
      },
    } as never);

    const result = await fetchAllAuditLogs({});

    expect(result).toHaveLength(AUDIT_EXPORT_MAX_ROWS);
    expect(mockGet).toHaveBeenCalledTimes(AUDIT_EXPORT_MAX_ROWS / AUDIT_EXPORT_PAGE_SIZE);
  });
});

describe("buildAuditExportFilename", () => {
  it("includes a zero-padded local timestamp and a .json extension", () => {
    const date = new Date(2025, 5, 1, 9, 5, 3); // 2025-06-01 09:05:03
    expect(buildAuditExportFilename(date)).toBe("audit-logs-20250601-090503.json");
  });
});