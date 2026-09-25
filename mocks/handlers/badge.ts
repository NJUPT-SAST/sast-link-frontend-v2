import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import { badgeState } from "../data/badge";
import { mockUsers } from "../data/users";

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ code: 0, message: "ok", data }, { status });
}

function fail(status: number, code: number, message: string) {
  return HttpResponse.json({ code, message, data: null }, { status });
}

/** Sizes of the mock preview SVG, mirroring the backend's fixed canvases. */
const CANVAS: Record<string, { w: number; h: number }> = {
  sm: { w: 320, h: 72 },
  md: { w: 460, h: 120 },
  lg: { w: 540, h: 200 },
};

const FONT_STACK =
  "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC','Source Han Sans SC',sans-serif";

/** A minimal stand-in for the backend renderer: same canvas, same slot
 * skeleton, enough for the settings preview and the copy-snippet flow. */
function previewSvg(size: string, theme: string) {
  const canvas = CANVAS[size] ?? CANVAS.md;
  const dark = theme === "dark";
  const bg = dark ? "#16181d" : "#ffffff";
  const fg = dark ? "#e8eaed" : "#1c1f23";
  const muted = dark ? "#9aa0a6" : "#6b7280";
  const detail = mockUsers[0]?.profile?.profile;
  const nickname = detail?.nickname ?? "SAST 成员";
  const intro = size === "sm" ? "" : detail?.intro ?? "";
  const nameSize = size === "lg" ? 24 : size === "md" ? 20 : 17;
  const nameY = size === "lg" ? 88 : size === "md" ? 52 : 34;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.w}" height="${canvas.h}" viewBox="0 0 ${canvas.w} ${canvas.h}" role="img" aria-label="${nickname} 的 SAST Link 徽标（预览）">
<style>.bg{fill:${bg}}.fg{fill:${fg}}.muted{fill:${muted}}${theme === "auto" ? `@media (prefers-color-scheme: dark){.bg{fill:#16181d}.fg{fill:#e8eaed}.muted{fill:#9aa0a6}}` : ""}</style>
<rect class="bg" width="${canvas.w}" height="${canvas.h}" rx="10"/>
<circle class="muted" cx="${size === "lg" ? 92 : size === "md" ? 60 : 36}" cy="${canvas.h / 2}" r="${size === "lg" ? 64 : size === "md" ? 44 : 28}"/>
<text class="bg" x="${size === "lg" ? 92 : size === "md" ? 60 : 36}" y="${canvas.h / 2 + (size === "lg" ? 22 : 15)}" text-anchor="middle" font-size="${size === "lg" ? 64 : 44}" font-family="${FONT_STACK}" font-weight="600">${nickname.slice(0, 1)}</text>
<text class="fg" x="${size === "lg" ? 180 : size === "md" ? 122 : 78}" y="${nameY}" font-size="${nameSize}" font-family="${FONT_STACK}" font-weight="600">${nickname}</text>
${intro ? `<text class="muted" x="${size === "lg" ? 180 : 122}" y="${nameY + 50}" font-size="${size === "lg" ? 14 : 12}" font-family="${FONT_STACK}">${intro}</text>` : ""}
<text class="muted" x="${canvas.w - 14}" y="20" text-anchor="end" font-size="9" font-family="${FONT_STACK}" letter-spacing="1">SAST Link</text>
</svg>`;
}

export const badgeHandlers = [
  http.get(`${API_BASE_URL}/user/badge`, () => {
    if (!badgeState.enabled) {
      return HttpResponse.json(ok({ enabled: false }));
    }
    return HttpResponse.json(
      ok({ enabled: true, key: badgeState.key, enabled_at: badgeState.enabledAt }),
    );
  }),

  http.post(`${API_BASE_URL}/user/badge`, () => {
    if (badgeState.enabled) {
      return HttpResponse.json(fail(409, 40907, "徽标已开启"), { status: 409 });
    }
    badgeState.enabled = true;
    badgeState.enabledAt = new Date().toISOString();
    return HttpResponse.json(
      ok({ enabled: true, key: badgeState.key, enabled_at: badgeState.enabledAt }),
      { status: 201 },
    );
  }),

  http.delete(`${API_BASE_URL}/user/badge`, () => {
    badgeState.enabled = false;
    return HttpResponse.json(ok({ message: "徽标已关闭" }));
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
      previewSvg(url.searchParams.get("size") ?? "md", url.searchParams.get("theme") ?? "auto"),
      { status: 200, headers: { "Content-Type": "image/svg+xml; charset=utf-8" } },
    );
  }),
];
