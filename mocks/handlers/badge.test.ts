import { API_BASE_URL } from "@/lib/config/public";
import { badgeState } from "../data/badge";

/**
 * Contract tests for the badge mock handlers: they must answer with the same
 * envelopes, status codes and auth gate as the real backend, so the mock-mode
 * settings preview behaves like production. These exist because an earlier
 * revision double-wrapped the ok() helper in HttpResponse.json — a bug every
 * unit test missed (they mock the apiClient) and only mock-mode usage hit.
 */
const auth = { Authorization: "Bearer access-1-0" };

describe("mock badge contract", () => {
  afterEach(() => {
    badgeState.enabled = false;
  });

  it("answers the disabled status without a key", async () => {
    const response = await fetch(`${API_BASE_URL}/user/badge`, { headers: auth });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      code: 0,
      message: "ok",
      data: { enabled: false },
    });
  });

  it("gates the management endpoints behind authentication", async () => {
    for (const [method, path] of [
      ["GET", "/user/badge"],
      ["POST", "/user/badge"],
      ["DELETE", "/user/badge"],
    ] as const) {
      const response = await fetch(`${API_BASE_URL}${path}`, { method });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        code: 40100,
        message: "未登录",
        data: null,
      });
    }
  });

  it("enables with 201 and the capability key, refuses a second enable with 40907", async () => {
    const enable = await fetch(`${API_BASE_URL}/user/badge`, {
      method: "POST",
      headers: auth,
    });
    expect(enable.status).toBe(201);
    const body = await enable.json();
    expect(body).toMatchObject({ code: 0, data: { enabled: true } });
    expect(typeof body.data.key).toBe("string");
    expect(body.data.key).toBe(badgeState.key);

    const again = await fetch(`${API_BASE_URL}/user/badge`, {
      method: "POST",
      headers: auth,
    });
    expect(again.status).toBe(409);
    await expect(again.json()).resolves.toMatchObject({ code: 40907 });
  });

  it("disable is idempotent and keeps the same key across a pause/resume", async () => {
    const enable = await fetch(`${API_BASE_URL}/user/badge`, {
      method: "POST",
      headers: auth,
    });
    const { data } = await enable.json();

    const disable = await fetch(`${API_BASE_URL}/user/badge`, {
      method: "DELETE",
      headers: auth,
    });
    expect(disable.status).toBe(200);
    await expect(disable.json()).resolves.toMatchObject({ data: { message: "徽标已关闭" } });

    const disableAgain = await fetch(`${API_BASE_URL}/user/badge`, {
      method: "DELETE",
      headers: auth,
    });
    expect(disableAgain.status).toBe(200);

    // Re-enable restores the same key — toggling never rotates it.
    const reEnable = await fetch(`${API_BASE_URL}/user/badge`, {
      method: "POST",
      headers: auth,
    });
    const reBody = await reEnable.json();
    expect(reBody.data.key).toBe(data.key);
  });

  it("renders the badge SVG while enabled and the closed card while paused", async () => {
    const enable = await fetch(`${API_BASE_URL}/user/badge`, {
      method: "POST",
      headers: auth,
    });
    const { data } = await enable.json();
    const key = data.key as string;

    const render = await fetch(`${API_BASE_URL}/badge/${key}.svg?size=sm&theme=light`);
    expect(render.status).toBe(200);
    expect(render.headers.get("Content-Type")).toBe("image/svg+xml; charset=utf-8");
    const svg = await render.text();
    expect(svg).toContain('width="320"');
    expect(svg).not.toContain("&lt;");

    await fetch(`${API_BASE_URL}/user/badge`, { method: "DELETE", headers: auth });
    const closed = await fetch(`${API_BASE_URL}/badge/${key}.svg`);
    expect(closed.status).toBe(404);
    expect(await closed.text()).toContain("徽标不存在或已关闭");
  });

  it("does not authenticate the public render endpoint", async () => {
    const response = await fetch(`${API_BASE_URL}/badge/unknown-key.svg`);
    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toContain("徽标不存在或已关闭");
  });
});
