import { API_BASE_URL } from "@/lib/config/public";
import { mockUsers } from "../data/users";

/**
 * Contract test for the admin PUT handler's PR #104 mirrors: identity
 * assertions (login_email rewrite, personal_email bind) are admin-only and
 * refused on field presence, and the student-id occupancy check folds case
 * and whitespace while excluding the target's own row.
 */

// MSW handlers authorize on the access-<id>- token shape.
const adminAuth = { Authorization: "Bearer access-2-0" };

const manager = mockUsers.find((user) => user.profile.role === "manager");
const member = mockUsers.find(
  (user) => user.profile.role === "member" && user.profile.state !== "is_deleted",
);

if (!manager || !member) throw new Error("mock data lacks a manager/member pair to test with");

const managerAuth = { Authorization: `Bearer access-${manager.id}-x` };
const memberUrl = `${API_BASE_URL}/admin/users/${member.profile.id}`;

async function put(body: unknown, auth: Record<string, string> = managerAuth) {
  return fetch(memberUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
  });
}

describe("mock admin identity-boundary contract (PR #104)", () => {
  it("refuses a manager's login_email on field presence, even an unchanged value", async () => {
    const response = await put({ login_email: member.profile.login_email });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: 40300,
      message: "仅管理员可修改 login_email",
    });
  });

  it("refuses a manager's personal_email bind", async () => {
    const response = await put({ personal_email: "manager-picked@qq.com" });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: 40300,
      message: "仅管理员可绑定 personal_email",
    });
  });

  it("lets a manager through with a non-identity edit", async () => {
    const response = await put({ qq_number: "987654321" });
    expect(response.status).toBe(200);
  });

  it("lets an admin rewrite login_email (the gate is manager-only)", async () => {
    const response = await put(
      { login_email: "case-admin@sast.fun", qq_number: "987654322" },
      adminAuth,
    );
    expect(response.status).toBe(200);
  });

  it("folds case and whitespace on student-id occupancy (40902)", async () => {
    // Another account's ID, re-cased and padded, must collide.
    const other = mockUsers.find(
      (user) =>
        user.profile.id !== member.profile.id &&
        user.profile.state !== "is_deleted" &&
        user.profile.student_id.trim().toLowerCase() !==
          member.profile.student_id.trim().toLowerCase(),
    );
    if (!other) throw new Error("mock data lacks a second distinct student id");
    const variant = other.profile.student_id.toUpperCase() === other.profile.student_id
      ? other.profile.student_id.toLowerCase()
      : other.profile.student_id.toUpperCase();
    const response = await put({ student_id: ` ${variant} ` });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 40902,
      message: "学号已被占用",
    });
  });

  it("case-normalizing the target's own student id is not a collision", async () => {
    const own = member.profile.student_id.toLowerCase();
    const response = await put({ student_id: own });
    expect(response.status).toBe(200);
  });
});
