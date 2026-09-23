import { API_BASE_URL } from "@/lib/config/public";

/**
 * Contract test for the mock list endpoints' paging window. The handlers used
 * to clamp page_size into range, which let the audit export's page_size=500
 * survive every local run and fail only against the real backend (which
 * refuses the window with 400 via web.ParsePaging). These tests pin the mock
 * to the backend's behaviour: refuse, don't clamp.
 */
const auth = { Authorization: "Bearer access-2-0" };

describe("mock admin paging contract", () => {
  it.each(["/admin/users", "/admin/audit-logs"])(
    "rejects an oversized page_size on %s with the backend's 400 envelope",
    async (path) => {
      const response = await fetch(`${API_BASE_URL}${path}?page_size=500`, {
        headers: auth,
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        code: 40000,
        message: "请求参数错误",
        data: null,
      });
    },
  );

  it.each([
    ["page_size=0", "/admin/users?page_size=0"],
    ["page_size=abc", "/admin/users?page_size=abc"],
    ["page=-1", "/admin/users?page=-1"],
    ["page=abc", "/admin/audit-logs?page=abc"],
  ])("rejects %s (present but not a positive integer)", async (_label, url) => {
    const response = await fetch(`${API_BASE_URL}${url}`, { headers: auth });
    expect(response.status).toBe(400);
  });

  it("keeps the endpoint-specific defaults: 20 for users, 50 for audit logs", async () => {
    const users = await fetch(`${API_BASE_URL}/admin/users`, { headers: auth });
    expect(users.status).toBe(200);
    await expect(users.json()).resolves.toMatchObject({
      data: { page: 1, page_size: 20 },
    });

    const logs = await fetch(`${API_BASE_URL}/admin/audit-logs`, { headers: auth });
    expect(logs.status).toBe(200);
    await expect(logs.json()).resolves.toMatchObject({
      data: { page: 1, page_size: 50 },
    });
  });
});
