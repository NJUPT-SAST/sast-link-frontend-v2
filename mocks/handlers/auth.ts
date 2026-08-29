import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import type { RegisterRequest } from "@/lib/api/types";
import { codes, emailForTicket, loginCodes, sendCode, verifyCode } from "../data/tickets";
import { createMockUser, findUserByEmail, issueTokens, mockUsers } from "../data/users";

/** Read one cookie out of a Cookie request header (jsdom tests set the mock
 *  session cookie via document.cookie so the /auth/refresh handler can
 *  simulate the httpOnly-cookie bootstrap path). */
function cookieValue(cookieHeader: string, name: string): string | null {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(cookieHeader);
  return match ? match[1] : null;
}

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ code: 0, message: "ok", data }, { status });
}
/** Like ok, but also sets the httpOnly `sl_session` cookie (value = the refresh
 *  token), mirroring the real backend. The Set-Cookie header is applied by the
 *  browser in dev (mocks/browser.ts); under MSW's node server (jest) jsdom does
 *  not apply it, so tests that drive the cookie path set document.cookie
 *  themselves. */
function cookieOk<T>(data: T, refreshToken: string, status = 200) {
  return HttpResponse.json(
    { code: 0, message: "ok", data },
    {
      status,
      headers: {
        "Set-Cookie": `sl_session=${refreshToken}; Path=/v2; HttpOnly; SameSite=Lax`,
      },
    },
  );
}
function fail(status: number, code: number, message: string) {
  return HttpResponse.json({ code, message, data: null }, { status });
}
function authUser(user: (typeof mockUsers)[number]) {
  const { id, login_email, name, role, state, email_type, created_at, profile_needs_completion, incomplete_fields } = user.profile;
  return { id, login_email, name, role, state, email_type, created_at, profile_needs_completion, incomplete_fields };
}

export const authHandlers = [
  http.post(`${API_BASE_URL}/auth/register/send-code`, async ({ request }) => {
    const { login_email } = await request.json() as { login_email: string };
    if (findUserByEmail(login_email)) return fail(409, 40901, "邮箱已被注册");
    sendCode(login_email);
    return ok({ message: "验证码已发送至邮箱", expires_in: 300 });
  }),
  http.post(`${API_BASE_URL}/auth/register/verify-code`, async ({ request }) => {
    const { login_email, code } = await request.json() as { login_email: string; code: string };
    const ticket = verifyCode(login_email, code);
    return ticket ? ok({ register_ticket: ticket, expires_in: 300 }) : fail(401, 40100, "验证码错误或已过期");
  }),
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as RegisterRequest;
    const email = emailForTicket(body.register_ticket);
    if (!email) return fail(401, 40100, "Register-Ticket 无效");
    if (body.password.length < 8) return fail(422, 42201, "密码长度不足（最短 8 位）");
    const user = createMockUser({ loginEmail: email, password: body.password, name: body.name, phoneNumber: body.phone_number, qqNumber: body.qq_number, college: body.college, major: body.major, studentId: body.student_id });
    const pair = issueTokens(user);
    return cookieOk({ ...pair, user: authUser(user) }, pair.refresh_token, 201);
  }),
  http.post(`${API_BASE_URL}/user/login`, async ({ request }) => {
    const { login_email, password } = await request.json() as { login_email: string; password: string };
    const user = findUserByEmail(login_email);
    // One indistinguishable 40105 for email-not-found, wrong password, and
    // deleted accounts (backend PR #73): clients must not be able to tell
    // whether an email is registered. The real reason stays in the audit log;
    // forgot-password/send-code below still returns 40106 for a missing email.
    if (!user || password !== user.password) return fail(401, 40105, "邮箱或密码错误");
    const pair = issueTokens(user);
    return cookieOk({ ...pair, user: authUser(user) }, pair.refresh_token);
  }),
  http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
    // The real endpoint accepts the refresh token from the JSON body (the
    // sessionStorage-based refresh) or, when the body is empty, from the
    // httpOnly session cookie — the latter is the new-tab bootstrap path. In
    // tests the cookie is a mock `sl_session` value set via document.cookie.
    const body = await request.json().catch(() => ({})) as { refresh_token?: string };
    const refreshToken =
      body.refresh_token ?? cookieValue(request.headers.get("Cookie") ?? "", "sl_session");
    if (!refreshToken) return fail(401, 40100, "Refresh Token 无效");
    const user = mockUsers.find((item) => item.refreshToken === refreshToken);
    if (!user) return fail(401, 40100, "Refresh Token 无效");
    const pair = issueTokens(user);
    return cookieOk(pair, pair.refresh_token);
  }),
  http.post(`${API_BASE_URL}/auth/logout`, async ({ request }) => {
    // The frontend sends an empty body now — the refresh credential is the
    // httpOnly `sl_session` cookie (or a legacy body token from older callers).
    const body = await request.json().catch(() => ({})) as { refresh_token?: string };
    const refreshToken =
      body.refresh_token ?? cookieValue(request.headers.get("Cookie") ?? "", "sl_session");
    if (!refreshToken) return fail(400, 40000, "缺少 refresh token");
    const user = mockUsers.find((item) => item.refreshToken === refreshToken);
    if (user) user.refreshToken = "";
    return ok({ message: "登出成功" });
  }),
  http.post(`${API_BASE_URL}/auth/change-password`, async ({ request }) => {
    const authorization = request.headers.get("Authorization") ?? "";
    const user = mockUsers.find((item) => authorization.startsWith(`Bearer access-${item.id}-`));
    const { old_password, new_password } = await request.json() as { old_password: string; new_password: string };
    if (!user) return fail(401, 40100, "未登录");
    if (user.password !== old_password) return fail(401, 40105, "密码错误");
    user.password = new_password;
    return ok({ message: "密码修改成功" });
  }),
  http.post(`${API_BASE_URL}/auth/forgot-password/send-code`, async ({ request }) => {
    const { login_email } = await request.json() as { login_email: string };
    if (!findUserByEmail(login_email)) return fail(401, 40106, "登录邮箱不存在");
    sendCode(login_email);
    return ok({ message: "验证码已发送至邮箱", expires_in: 300 });
  }),
  http.post(`${API_BASE_URL}/auth/reset-password`, async ({ request }) => {
    const { login_email, code, new_password } = await request.json() as { login_email: string; code: string; new_password: string };
    const user = findUserByEmail(login_email);
    if (!user || codes.get(login_email)?.code !== code) return fail(422, 42200, "验证码错误");
    user.password = new_password;
    return ok({ message: "密码重置成功" });
  }),
  http.post(`${API_BASE_URL}/oauth/exchange-code`, async ({ request }) => {
    const { code } = await request.json() as { code: string };
    const user = mockUsers.find((item) => item.id === loginCodes.get(code));
    if (!user) return fail(401, 40100, "登录码无效或已过期");
    loginCodes.delete(code);
    const pair = issueTokens(user);
    return cookieOk({ ...pair, user: authUser(user) }, pair.refresh_token);
  }),
];
