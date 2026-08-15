import {
  adminUserDetailHref,
  adminUserEditHref,
  parseAdminUserId,
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
});
