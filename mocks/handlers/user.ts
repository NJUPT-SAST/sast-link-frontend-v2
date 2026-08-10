import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import type { UpdateProfileRequest } from "@/lib/api/types";
import { bindTickets } from "../data/tickets";
import { findUserByAccessToken, identity } from "../data/users";
import { DEFAULT_AVATAR, MAX_AVATAR_UPLOAD_BYTES } from "@/lib/constants/profile";

function ok<T>(data: T) { return HttpResponse.json({ code: 0, message: "ok", data }); }
function fail(status: number, code: number, message: string) { return HttpResponse.json({ code, message, data: null }, { status }); }
function authenticated(request: Request) {
  const value = request.headers.get("Authorization");
  return value?.startsWith("Bearer ") ? findUserByAccessToken(value.slice(7)) : undefined;
}

export const userHandlers = [
  http.get(`${API_BASE_URL}/user/profile`, ({ request }) => {
    const user = authenticated(request);
    return user ? ok(user.profile) : fail(401, 40100, "未登录");
  }),
  http.put(`${API_BASE_URL}/user/profile`, async ({ request }) => {
    const user = authenticated(request);
    if (!user) return fail(401, 40100, "未登录");
    const body = await request.json() as UpdateProfileRequest;
    const rootFields = ["name", "phone_number", "qq_number", "college", "major", "student_id"] as const;
    for (const field of rootFields) if (body[field] !== undefined) Object.assign(user.profile, { [field]: body[field] });
    user.profile.profile ??= {};
    const profileMap = { nickname: "nickname", department: "department", intro: "intro", email: "email", blog_url: "blog_url", github_url: "github_url" } as const;
    for (const [source, target] of Object.entries(profileMap)) {
      const value = body[source as keyof UpdateProfileRequest];
      if (value !== undefined) Object.assign(user.profile.profile, { [target]: value });
    }
    return ok({ message: "个人信息更新成功", user: user.profile });
  }),
  http.put(`${API_BASE_URL}/user/avatar`, async ({ request }) => {
    const user = authenticated(request);
    if (!user) return fail(401, 40100, "未登录");
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_AVATAR_UPLOAD_BYTES) return fail(400, 40000, "头像格式或大小不符合要求");
    const avatarUrl = DEFAULT_AVATAR;
    user.profile.profile ??= {};
    user.profile.profile.avatar = avatarUrl;
    return ok({ avatar_url: avatarUrl });
  }),
  http.get(`${API_BASE_URL}/user/identities`, ({ request }) => {
    const user = authenticated(request);
    return user ? ok({ identities: user.profile.identities }) : fail(401, 40100, "未登录");
  }),
  http.post(`${API_BASE_URL}/user/identities/email`, async ({ request }) => {
    const user = authenticated(request);
    if (!user) return fail(401, 40100, "未登录");
    const { email } = await request.json() as { email: string };
    const ticket = `bind-${user.id}-${Date.now()}`;
    bindTickets.set(ticket, email);
    return ok({ bind_ticket: ticket });
  }),
  http.post(`${API_BASE_URL}/user/identities/:provider`, async ({ request, params }) => {
    const user = authenticated(request);
    if (!user) return fail(401, 40100, "未登录");
    const provider = String(params.provider);
    if (provider !== "lark" && provider !== "github") return fail(404, 40400, "未知 provider");
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code) return fail(400, 40000, "code 不能为空");
    const next = identity(Date.now(), provider, `mock-${provider}-${code}`);
    user.profile.identities = user.profile.identities.filter((item) => item.provider !== provider);
    user.profile.identities.push(next);
    return ok({ identity: next });
  }),
  http.post(`${API_BASE_URL}/user/identities/email/verify`, async ({ request }) => {
    const user = authenticated(request);
    if (!user) return fail(401, 40100, "未登录");
    const { bind_ticket, code } = await request.json() as { bind_ticket: string; code: string };
    const email = bindTickets.get(bind_ticket);
    if (!email || code !== "123456") return fail(400, 40000, "验证码错误");
    const next = identity(Date.now(), "other_mail", email);
    user.profile.identities.push(next);
    return ok({ identity: next });
  }),
  http.delete(`${API_BASE_URL}/user/identities/:id`, async ({ request, params }) => {
    const user = authenticated(request);
    if (!user) return fail(401, 40100, "未登录");
    const { password } = await request.json() as { password: string };
    if (password !== user.password) return fail(422, 42200, "当前密码错误");
    user.profile.identities = user.profile.identities.filter((item) => item.id !== Number(params.id));
    return ok({ message: "解绑成功" });
  }),
];
