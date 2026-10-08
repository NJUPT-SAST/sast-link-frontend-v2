jest.mock("./redirect", () => ({
  redirectTo: jest.fn(),
}));

jest.mock("./client", () => ({
  apiClient: { post: jest.fn() },
}));

jest.mock("@/lib/config/public", () => ({
  __esModule: true,
  API_BASE_URL: "http://localhost:8080",
  FEISHU_CLIENT_ID: undefined,
  FEISHU_BIND_REDIRECT_URI: undefined,
  GITHUB_CLIENT_ID: undefined,
  GITHUB_BIND_REDIRECT_URI: undefined,
}));

import { apiClient } from "./client";
import { redirectTo } from "./redirect";
import {
  beginOAuthLogin,
  buildBindOAuthUrl,
  clearPKCEVerifier,
  consumeBindState,
  exchangeLoginCode,
  hasRecentOAuthLoginInitiation,
  larkAppCodeLogin,
  markOAuthLoginInitiated,
  pkceChallengeS256,
  readPKCEVerifier,
  stagePKCEVerifier,
} from "./oauth";

import * as publicConfig from "@/lib/config/public";

const BIND_STATE_KEY = "sast:oauth-bind:state";
const LOGIN_INITIATED_KEY = "sast:oauth-login-init";

describe("lib/api/oauth v2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    (publicConfig as Record<string, unknown>).FEISHU_CLIENT_ID = undefined;
    (publicConfig as Record<string, unknown>).FEISHU_BIND_REDIRECT_URI = undefined;
    (publicConfig as Record<string, unknown>).GITHUB_CLIENT_ID = undefined;
    (publicConfig as Record<string, unknown>).GITHUB_BIND_REDIRECT_URI = undefined;
  });

  it("starts a provider login with a fresh S256 challenge per click", async () => {
    await beginOAuthLogin("github");
    expect(redirectTo).toHaveBeenCalledTimes(1);
    const url = jest.mocked(redirectTo).mock.calls[0][0] as string;
    expect(url.startsWith("http://localhost:8080/oauth/github?code_challenge=")).toBe(true);
    const challenge = url.split("code_challenge=")[1].split("&")[0];
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.endsWith("&code_challenge_method=S256")).toBe(true);
    // The verifier for that challenge is staged for the exchange leg, and the
    // initiation stamp for the callback's stop-page guard is armed.
    expect(readPKCEVerifier()).toMatch(/^[A-Za-z0-9-._~]{64}$/);
    expect(hasRecentOAuthLoginInitiation()).toBe(true);
  });

  it("absorbs a same-frame double click into one launch", async () => {
    // Two begins racing in the same frame would stage two verifiers — the
    // URL could then carry the first challenge while the second verifier is
    // what survives in storage, and the backend would refuse the exchange.
    await Promise.all([beginOAuthLogin("github"), beginOAuthLogin("github")]);
    expect(jest.mocked(redirectTo)).toHaveBeenCalledTimes(1);
  });

  it("hashes S256 challenges per RFC 7636 appendix B", async () => {
    // The spec's own test vector: this verifier must hash to exactly this
    // challenge, pinning the implementation to the standard.
    await expect(
      pkceChallengeS256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
    ).resolves.toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("stages a verifier and returns its 43-char S256 challenge", async () => {
    const challenge = await stagePKCEVerifier();
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(readPKCEVerifier()).toMatch(/^[A-Za-z0-9-._~]{64}$/);
  });

  it("clears the staged verifier", async () => {
    await stagePKCEVerifier();
    expect(readPKCEVerifier()).not.toBe("");
    clearPKCEVerifier();
    expect(readPKCEVerifier()).toBe("");
  });

  it("exchanges the one-time login code with its PKCE verifier", () => {
    exchangeLoginCode("login-code", "the-verifier");
    expect(apiClient.post).toHaveBeenCalledWith("/oauth/exchange-code", {
      code: "login-code",
      code_verifier: "the-verifier",
    });
  });

  it("submits the JSAPI pre-authorization code with its PKCE challenge", () => {
    larkAppCodeLogin("pre-auth-code", "the-challenge");
    expect(apiClient.post).toHaveBeenCalledWith("/oauth/lark/app-code", {
      code: "pre-auth-code",
      code_challenge: "the-challenge",
    });
  });

  it("returns null for the bind URL when env is missing", () => {
    expect(buildBindOAuthUrl("lark")).toBeNull();
    expect(buildBindOAuthUrl("github")).toBeNull();
  });

  it("builds the feishu authorize URL and stores the state", () => {
    (publicConfig as Record<string, unknown>).FEISHU_CLIENT_ID = "cli_test";
    (publicConfig as Record<string, unknown>).FEISHU_BIND_REDIRECT_URI =
      "http://localhost:3000/oauth/bind/lark";

    const url = buildBindOAuthUrl("lark");
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://open.feishu.cn/open-apis/authen/v1/authorize",
    );
    expect(parsed.searchParams.get("app_id")).toBe("cli_test");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/oauth/bind/lark",
    );
    const state = parsed.searchParams.get("state");
    expect(state).toBeTruthy();
    expect(sessionStorage.getItem(`${BIND_STATE_KEY}:lark`)).toBe(state);
  });

  it("builds the github authorize URL with scope and state", () => {
    (publicConfig as Record<string, unknown>).GITHUB_CLIENT_ID = "gh_test";
    (publicConfig as Record<string, unknown>).GITHUB_BIND_REDIRECT_URI =
      "http://localhost:3000/oauth/bind/github";

    const url = buildBindOAuthUrl("github");
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://github.com/login/oauth/authorize",
    );
    expect(parsed.searchParams.get("client_id")).toBe("gh_test");
    expect(parsed.searchParams.get("scope")).toBe("read:user");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/oauth/bind/github",
    );
    const state = parsed.searchParams.get("state");
    expect(state).toBeTruthy();
    expect(sessionStorage.getItem(`${BIND_STATE_KEY}:github`)).toBe(state);
  });

  it("consumes and verifies the bind state", () => {
    sessionStorage.setItem(`${BIND_STATE_KEY}:lark`, "abc");
    expect(consumeBindState("lark", "abc")).toBe(true);
    expect(sessionStorage.getItem(`${BIND_STATE_KEY}:lark`)).toBeNull();

    sessionStorage.setItem(`${BIND_STATE_KEY}:lark`, "abc");
    expect(consumeBindState("lark", "wrong")).toBe(false);
    expect(consumeBindState("lark", null)).toBe(false);
  });

  it("reports a fresh initiation stamp as recent", () => {
    markOAuthLoginInitiated("github");
    expect(
      Number(sessionStorage.getItem(`${LOGIN_INITIATED_KEY}:github`)),
    ).toBeLessThanOrEqual(Date.now());
    expect(hasRecentOAuthLoginInitiation()).toBe(true);
  });

  it("ignores an expired initiation stamp (pure read, no removal)", () => {
    sessionStorage.setItem(
      `${LOGIN_INITIATED_KEY}:lark`,
      String(Date.now() - 16 * 60 * 1000),
    );
    expect(hasRecentOAuthLoginInitiation()).toBe(false);
    // The function runs during render, so it must not mutate storage.
    expect(sessionStorage.getItem(`${LOGIN_INITIATED_KEY}:lark`)).not.toBeNull();
  });

  it("reports no initiation when nothing was stamped", () => {
    expect(hasRecentOAuthLoginInitiation()).toBe(false);
  });
});
