import { canManageUsers, canWriteTargetUser } from "./permissions";

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
