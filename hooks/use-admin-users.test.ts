import { buildAdminUsersKey, buildAdminUserKey } from "./use-admin-users";

jest.mock("@/lib/token", () => ({
  getSession: jest.fn(() => ({ accessToken: "tok" })),
}));

describe("buildAdminUsersKey", () => {
  it("serializes the needs_completion filter so SWR revalidates on change", () => {
    expect(buildAdminUsersKey({ page: 1, page_size: 20, needs_completion: true })).toContain(
      "needs_completion=true",
    );
    expect(buildAdminUsersKey({ page: 1, page_size: 20, needs_completion: false })).toContain(
      "needs_completion=false",
    );
  });

  it("omits needs_completion when it is undefined", () => {
    expect(buildAdminUsersKey({ page: 1, page_size: 20 })).not.toContain("needs_completion");
  });

  it("produces distinct keys for each completion state", () => {
    const all = buildAdminUsersKey({ page: 1, page_size: 20 });
    const pending = buildAdminUsersKey({ page: 1, page_size: 20, needs_completion: true });
    const complete = buildAdminUsersKey({ page: 1, page_size: 20, needs_completion: false });
    expect(new Set([all, pending, complete]).size).toBe(3);
  });

  it("keeps the other filters in the key", () => {
    const key = buildAdminUsersKey({
      page: 2,
      page_size: 50,
      role: "admin",
      keyword: "alice",
      needs_completion: true,
    });
    expect(key).toContain("page=2");
    expect(key).toContain("page_size=50");
    expect(key).toContain("role=admin");
    expect(key).toContain("keyword=alice");
  });

  it("builds a stable user-detail key", () => {
    expect(buildAdminUserKey(7)).toBe("admin-user:7");
  });
});
