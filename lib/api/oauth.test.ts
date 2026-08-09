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
import {
  buildBindOAuthUrl,
  buildOAuthLoginUrl,
  consumeBindState,
  exchangeLoginCode,
} from "./oauth";
import * as publicConfig from "@/lib/config/public";

const BIND_STATE_KEY = "sast:oauth-bind:state";

describe("lib/api/oauth v2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    (publicConfig as Record<string, unknown>).FEISHU_CLIENT_ID = undefined;
    (publicConfig as Record<string, unknown>).FEISHU_BIND_REDIRECT_URI = undefined;
    (publicConfig as Record<string, unknown>).GITHUB_CLIENT_ID = undefined;
    (publicConfig as Record<string, unknown>).GITHUB_BIND_REDIRECT_URI = undefined;
  });

  it("uses same-origin provider login routes", () => {
    expect(buildOAuthLoginUrl("github")).toBe("http://localhost:8080/oauth/github");
    expect(buildOAuthLoginUrl("lark")).toBe("http://localhost:8080/oauth/lark");
  });

  it("exchanges the one-time login code", () => {
    exchangeLoginCode("login-code");
    expect(apiClient.post).toHaveBeenCalledWith("/oauth/exchange-code", {
      code: "login-code",
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
});
