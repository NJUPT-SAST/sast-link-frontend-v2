import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import { badgeState } from "../data/badge";
import { mockUsers, findUserByAccessToken } from "../data/users";

function ok<T>(data: T) {
  return HttpResponse.json({ code: 0, message: "ok", data });
}
function fail(status: number, code: number, message: string) {
  return HttpResponse.json({ code, message, data: null }, { status });
}
function authenticated(request: Request) {
  const value = request.headers.get("Authorization");
  return value?.startsWith("Bearer ") ? findUserByAccessToken(value.slice(7)) : undefined;
}

/** Sizes of the mock preview SVG, mirroring the backend's fixed canvas. */
const CANVAS: Record<string, { w: number; h: number }> = {
  sm: { w: 320, h: 72 },
};

const FONT_STACK =
  "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC','Source Han Sans SC',sans-serif";

/** A minimal stand-in for the backend renderer: same canvas, same slot
 * skeleton, enough for the settings preview and the copy-snippet flow. */
function previewSvg(size: string, theme: string) {
  const canvas = CANVAS[size] ?? CANVAS.sm;
  const dark = theme === "dark";
  const bg = dark ? "#16181d" : "#ffffff";
  const fg = dark ? "#e8eaed" : "#1c1f23";
  const muted = dark ? "#9aa0a6" : "#6b7280";
  const detail = mockUsers[0]?.profile?.profile;
  const nickname = detail?.nickname ?? "SAST 成员";
  const intro = detail?.intro ?? "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.w}" height="${canvas.h}" viewBox="0 0 ${canvas.w} ${canvas.h}" role="img" aria-label="${nickname} 的 SAST Link 徽标（预览）">
<style>.bg{fill:${bg}}.fg{fill:${fg}}.muted{fill:${muted}}${theme === "auto" ? `@media (prefers-color-scheme: dark){.bg{fill:#16181d}.fg{fill:#e8eaed}.muted{fill:#9aa0a6}}` : ""}</style>
<rect class="bg" width="${canvas.w}" height="${canvas.h}" rx="10"/>
<circle class="muted" cx="36" cy="${canvas.h / 2}" r="28"/>
<text class="bg" x="36" y="${canvas.h / 2 + 10}" text-anchor="middle" font-size="28" font-family="${FONT_STACK}" font-weight="600">${nickname.slice(0, 1)}</text>
<text class="fg" x="78" y="33" font-size="17" font-family="${FONT_STACK}" font-weight="600">${nickname}</text>
<text class="muted" x="78" y="54" font-size="11" font-family="${FONT_STACK}">「${intro}」</text>
<text class="muted" x="${canvas.w - 8}" y="16" text-anchor="end" font-size="9" font-family="${FONT_STACK}" letter-spacing="1">SAST Link</text>
</svg>`;
}

export const badgeHandlers = [
  http.get(`${API_BASE_URL}/user/badge`, ({ request }) => {
    if (!authenticated(request)) return fail(401, 40100, "未登录");
    if (!badgeState.enabled) {
      return ok({ enabled: false });
    }
    return ok({ enabled: true, key: badgeState.key, enabled_at: badgeState.enabledAt });
  }),

  http.post(`${API_BASE_URL}/user/badge`, ({ request }) => {
    if (!authenticated(request)) return fail(401, 40100, "未登录");
    if (badgeState.enabled) {
      return fail(409, 40907, "徽标已开启");
    }
    badgeState.enabled = true;
    badgeState.enabledAt = new Date().toISOString();
    return HttpResponse.json(
      { code: 0, message: "ok", data: { enabled: true, key: badgeState.key, enabled_at: badgeState.enabledAt } },
      { status: 201 },
    );
  }),

  http.delete(`${API_BASE_URL}/user/badge`, ({ request }) => {
    if (!authenticated(request)) return fail(401, 40100, "未登录");
    badgeState.enabled = false;
    return ok({ message: "徽标已关闭" });
  }),

  http.get(`${API_BASE_URL}/badge/:key`, ({ params, request }) => {
    const key = String(params.key).replace(/\.svg$/, "");
    if (!badgeState.enabled || key !== badgeState.key) {
      return new HttpResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="460" height="120" viewBox="0 0 460 120" role="img" aria-label="徽标不存在">
<rect width="460" height="120" rx="10" fill="#ffffff"/>
<text x="110" y="66" font-size="16" font-family="${FONT_STACK}" fill="#6b7280">徽标不存在或已关闭</text>
</svg>`,
        { status: 404, headers: { "Content-Type": "image/svg+xml; charset=utf-8" } },
      );
    }
    const url = new URL(request.url);
    return new HttpResponse(
      previewSvg(url.searchParams.get("size") ?? "sm", url.searchParams.get("theme") ?? "auto"),
      { status: 200, headers: { "Content-Type": "image/svg+xml; charset=utf-8" } },
    );
  }),
];
