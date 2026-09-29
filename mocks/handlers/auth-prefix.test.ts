import { API_BASE_URL } from "@/lib/config/public";

/**
 * Contract tests for the mock register endpoints' NJUPT prefix rule. The
 * backend (PR #101) refuses a non-student-ID @njupt.edu.cn local part with
 * 40022 on both the send-code and verify-code paths — ahead of any uniqueness
 * check and without consuming the one-time code — and caps login_email at 255
 * characters with a plain 40000. These tests pin the mock to that behaviour
 * so a local run cannot drift from the real backend.
 */
describe("mock register email prefix contract", () => {
  it.each(["xyz123@njupt.edu.cn", "2404052@njupt.edu.cn", "b24040525+x@njupt.edu.cn"])(
    "refuses the non-student-id prefix %s with 40022 on send-code",
    async (login_email) => {
      const response = await fetch(`${API_BASE_URL}/auth/register/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_email }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        code: 40022,
        message: "邮箱前缀格式错误",
        data: null,
      });
    },
  );

  it("refuses a non-student-id prefix with 40022 on verify-code", async () => {
    const response = await fetch(`${API_BASE_URL}/auth/register/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login_email: "xyz123@njupt.edu.cn", code: "123456" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: 40022,
      message: "邮箱前缀格式错误",
      data: null,
    });
  });

  it.each(["b24040526", "24040526"])(
    "accepts the student-id prefix %s and sends a code",
    async (localPart) => {
      const response = await fetch(`${API_BASE_URL}/auth/register/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_email: `${localPart}@njupt.edu.cn` }),
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ code: 0 });
    },
  );

  it("keeps the sast.fun prefix free-form", async () => {
    const response = await fetch(`${API_BASE_URL}/auth/register/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login_email: "any-nick@sast.fun" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ code: 0 });
  });

  it("rejects a login_email over 255 characters with 40000", async () => {
    const response = await fetch(`${API_BASE_URL}/auth/register/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login_email: `${"a".repeat(256)}@sast.fun` }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: 40000,
      message: "邮箱长度超出限制",
      data: null,
    });
  });
});
