import { canAccessAdminPath, canManageUsers, canWriteTargetUser } from "./permissions";

describe("canAccessAdminPath", () => {
  it("does not use the overview as permission for every admin subroute", () => {
    expect(canAccessAdminPath("/admin", "manager")).toBe(true);
    expect(canAccessAdminPath("/admin/users/edit", "manager")).toBe(true);
    for (const path of ["/admin/oauth-clients", "/admin/audit-logs", "/admin/alumni-requests"]) {
      expect(canAccessAdminPath(path, "manager")).toBe(false);
      expect(canAccessAdminPath(path, "lecturer")).toBe(false);
      expect(canAccessAdminPath(path, "admin")).toBe(true);
    }
  });
  it("allows lecturer user details but no overview or unknown routes", () => {
    expect(canAccessAdminPath("/admin/users/detail", "lecturer")).toBe(true);
    expect(canAccessAdminPath("/admin", "lecturer")).toBe(false);
    expect(canAccessAdminPath("/admin/unknown", "admin")).toBe(false);
    expect(canAccessAdminPath("/admin/users-other", "manager")).toBe(false);
  });
});

describe("canManageUsers", () => {
  it("admits admin and manager, refuses lecturer and student roles", () => {
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("manager")).toBe(true);
    expect(canManageUsers("lecturer")).toBe(false);
    expect(canManageUsers("member")).toBe(false);
    expect(canManageUsers("freshman")).toBe(false);
    expect(canManageUsers(undefined)).toBe(false);
  });
});

describe("canWriteTargetUser", () => {
  it("lets an admin write anyone", () => {
    for (const target of ["freshman", "member", "manager", "lecturer", "admin"]) {
      expect(canWriteTargetUser("admin", target)).toBe(true);
    }
  });

  it("lets a manager write every account but an admin's", () => {
    for (const target of ["freshman", "member", "manager", "lecturer"]) {
      expect(canWriteTargetUser("manager", target)).toBe(true);
    }
    expect(canWriteTargetUser("manager", "admin")).toBe(false);
  });

  it("refuses everything to a read-only viewer regardless of the target", () => {
    expect(canWriteTargetUser("lecturer", "member")).toBe(false);
    expect(canWriteTargetUser("lecturer", "admin")).toBe(false);
    expect(canWriteTargetUser(undefined, "member")).toBe(false);
  });
});
