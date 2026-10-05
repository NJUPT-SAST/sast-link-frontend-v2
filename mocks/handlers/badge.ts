import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import { badgeState } from "../data/badge";
import { mockUsers, findUserByAccessToken } from "../data/users";
import { failEnvelope, okEnvelope, withCors } from "./respond";

function ok<T>(data: T) {
  return HttpResponse.json({ code: 0, message: "ok", data });
}
function fail(status: number, code: number, message: string) {
  return failEnvelope(status, code, message);
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
  // Contrast border, mirroring the backend renderer: the light card carries
  // a dark frame and the dark card a light one, class-based so the auto
  // theme's media query flips it with everything else.
  const border = dark ? "#e8eaed" : "#1c1f23";
  const detail = mockUsers[0]?.profile?.profile;
  const nickname = detail?.nickname ?? "SAST 成员";
  const intro = detail?.intro ?? "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.w}" height="${canvas.h}" viewBox="0 0 ${canvas.w} ${canvas.h}" role="img" aria-label="${nickname} 的 SAST Link 徽标（预览）">
<style>.bg{fill:${bg}}.fg{fill:${fg}}.muted{fill:${muted}}.border{stroke:${border}}${theme === "auto" ? `@media (prefers-color-scheme: dark){.bg{fill:#16181d}.fg{fill:#e8eaed}.muted{fill:#9aa0a6}.border{stroke:#e8eaed}}` : ""}</style>
<rect class="bg" width="${canvas.w}" height="${canvas.h}" rx="10"/>
<rect x="0.5" y="0.5" width="${canvas.w - 1}" height="${canvas.h - 1}" rx="10" fill="none" class="border" stroke-width="1"/>
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
      { status: 201, headers: withCors() },
    );
  }),

  http.delete(`${API_BASE_URL}/user/badge`, ({ request }) => {
    if (!authenticated(request)) return fail(401, 40100, "未登录");
    badgeState.enabled = false;
    return ok({ message: "徽标已关闭" });
  }),

  http.get(`${API_BASE_URL}/badge/:key`, ({ params, request }) => {
    const key = String(params.key).replace(/\.svg$/, "");
    const url = new URL(request.url);
    // The backend normalizes unknown/empty theme values to auto; the mock
    // must do the same or a hand-edited ?theme=neon diverges from production
    // (fixed light card here, auto card there).
    const rawTheme = url.searchParams.get("theme");
    const theme = rawTheme === "light" || rawTheme === "dark" ? rawTheme : "auto";
    if (!badgeState.enabled || key !== badgeState.key) {
      // Closed card mirrors the backend: compact canvas, class-based palette
      // (theme-aware), contrast border, muted circle with a bg-colored ✕.
      const dark = theme === "dark";
      const bg = dark ? "#16181d" : "#ffffff";
      const muted = dark ? "#9aa0a6" : "#6b7280";
      const border = dark ? "#e8eaed" : "#1c1f23";
      return new HttpResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="72" viewBox="0 0 320 72" role="img" aria-label="徽标不存在或已关闭">
<style>.bg{fill:${bg}}.muted{fill:${muted}}.border{stroke:${border}}.mark{stroke:${bg}}${theme === "auto" ? `@media (prefers-color-scheme: dark){.bg{fill:#16181d}.muted{fill:#9aa0a6}.border{stroke:#e8eaed}.mark{stroke:#16181d}}` : ""}</style>
<rect class="bg" width="320" height="72" rx="10"/>
<rect x="0.5" y="0.5" width="319" height="71" rx="10" fill="none" class="border" stroke-width="1"/>
<circle cx="36" cy="36" r="28" class="muted"/>
<path d="M 26 26 L 46 46 M 46 26 L 26 46" class="mark" stroke-width="3" stroke-linecap="round"/>
<text x="78" y="41" class="muted" font-size="14" font-family="${FONT_STACK}">徽标不存在或已关闭</text>
<text x="312" y="16" text-anchor="end" class="muted" font-size="9" font-family="${FONT_STACK}" letter-spacing="1">SAST Link</text>
</svg>`,
        { status: 404, headers: withCors({ "Content-Type": "image/svg+xml; charset=utf-8" }) },
      );
    }
    return new HttpResponse(
      previewSvg(url.searchParams.get("size") ?? "sm", theme),
      { status: 200, headers: withCors({ "Content-Type": "image/svg+xml; charset=utf-8" }) },
    );
  }),
];
