import { API_BASE_URL } from "@/lib/config/public";

/**
 * Contract test for the mock alumni filing's NJUPT prefix rule. The backend
 * (PR #101) applies the student-ID prefix rule to every login_email write
 * path — alumni filings included, same code 40022 — after the captcha gate
 * and before the pending-ticket uniqueness checks.
 */
function filingBody(login_email: string) {
  return filingBodyWith("b18040101", login_email, "zhangsan@qq.com");
}

function filingBodyWith(student_id: string, login_email: string, personal_email: string) {
  return JSON.stringify({
    name: "张三",
    student_id,
    login_email,
    personal_email,
    phone_number: "13800000001",
    qq_number: "100001",
    college: "其他",
    major: "软件工程",
    join_year: "2018",
    department_note: "",
    note: "",
    captcha_token: "token",
  });
}

describe("mock alumni filing email prefix contract", () => {
  it("refuses a non-student-id njupt prefix with 40022", async () => {
    const response = await fetch(`${API_BASE_URL}/alumni-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: filingBody("xyz123@njupt.edu.cn"),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: 40022,
      message: "邮箱前缀格式错误",
      data: null,
    });
  });

  it("accepts the student-id prefix shape and files the request", async () => {
    const response = await fetch(`${API_BASE_URL}/alumni-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // A distinct identity per filing: the mock's 40906 pending-ticket guard
      // would otherwise refuse a second ticket for the same student_id.
      body: filingBodyWith("18040202", "18040202@njupt.edu.cn", "filing-2@example.org"),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ code: 0 });
  });
});
