import {
  adminUserDetailHref,
  adminUserEditHref,
  adminUsersListHref,
  parseAdminUserId,
  parseAdminUsersListQuery,
} from "./admin-user-route";

describe("admin user routes", () => {
  it("builds static detail and edit URLs", () => {
    expect(adminUserDetailHref(42)).toBe("/admin/users/detail?id=42");
    expect(adminUserEditHref(42)).toBe("/admin/users/edit?id=42");
  });

  it("accepts positive safe integer IDs only", () => {
    expect(parseAdminUserId(new URLSearchParams("id=42"))).toBe(42);
    expect(parseAdminUserId(new URLSearchParams("id=0"))).toBeNull();
    expect(parseAdminUserId(new URLSearchParams("id=-1"))).toBeNull();
    expect(parseAdminUserId(new URLSearchParams("id=1.5"))).toBeNull();
    expect(parseAdminUserId(new URLSearchParams("id=abc"))).toBeNull();
    expect(parseAdminUserId(new URLSearchParams())).toBeNull();
  });

  it("carries the list query so 返回 lands on the same page", () => {
    const listQuery = "page=3&role=admin";
    expect(adminUserDetailHref(42, listQuery)).toBe(
      `/admin/users/detail?id=42&list=${encodeURIComponent(listQuery)}`,
    );
    expect(adminUserEditHref(42, listQuery)).toBe(
      `/admin/users/edit?id=42&list=${encodeURIComponent(listQuery)}`,
    );
    expect(adminUsersListHref(listQuery)).toBe("/admin/users?page=3&role=admin");
    expect(adminUsersListHref()).toBe("/admin/users");
  });

  it("restores a stashed list query, sanitizing illegal filters", () => {
    const stash = new URLSearchParams({ list: "page=3&role=admin" });
    expect(parseAdminUsersListQuery(stash)).toBe("page=3&role=admin");

    const dirty = new URLSearchParams({ list: "page=abc&role=root&keyword=%E5%BC%A0" });
    expect(parseAdminUsersListQuery(dirty)).toBe("keyword=%E5%BC%A0");

    expect(parseAdminUsersListQuery(new URLSearchParams())).toBe("");
  });
});
