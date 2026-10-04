jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/lib/config/public", () => ({
  __esModule: true,
  API_BASE_URL: "",
  FEISHU_CLIENT_ID: "cli_app",
  FEISHU_BIND_REDIRECT_URI: undefined,
  GITHUB_CLIENT_ID: undefined,
  GITHUB_BIND_REDIRECT_URI: undefined,
}));

jest.mock("@/lib/lark-h5", () => ({
  loadLarkH5Sdk: (...args: unknown[]) => mockLoadLarkH5Sdk(...args),
  waitLarkH5Ready: (...args: unknown[]) => mockWaitLarkH5Ready(...args),
  requestLarkAppCode: (...args: unknown[]) => mockRequestLarkAppCode(...args),
  isLarkUserAgent: (ua: string) => /Lark|Feishu/i.test(ua),
}));

jest.mock("@/lib/api/oauth", () => ({
  larkAppCodeLogin: (...args: unknown[]) => mockLarkAppCodeLogin(...args),
}));

jest.mock("@/lib/login-session", () => ({
  establishLoginCodeSession: (...args: unknown[]) =>
    mockEstablishLoginCodeSession(...args),
}));

import { renderHook, act, waitFor } from "@testing-library/react";
import { useLarkH5AutoLogin } from "./use-lark-h5-auto-login";

const mockReplace = jest.fn();
const mockLoadLarkH5Sdk = jest.fn();
const mockWaitLarkH5Ready = jest.fn();
const mockRequestLarkAppCode = jest.fn();
const mockLarkAppCodeLogin = jest.fn();
const mockEstablishLoginCodeSession = jest.fn();

const LARK_UA = "Mozilla/5.0 ... Feishu/7.3.0";

function setup(sessionStatus: "loading" | "authenticated" | "unauthenticated", ua = LARK_UA) {
  const realUserAgent = window.navigator.userAgent;
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
    writable: true,
  });
  const hook = renderHook(({ status }) => useLarkH5AutoLogin(status), {
    initialProps: { status: sessionStatus },
  });
  Object.defineProperty(window.navigator, "userAgent", {
    value: realUserAgent,
    configurable: true,
    writable: true,
  });
  return hook;
}

describe("useLarkH5AutoLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadLarkH5Sdk.mockResolvedValue(undefined);
    mockWaitLarkH5Ready.mockResolvedValue(undefined);
    mockRequestLarkAppCode.mockResolvedValue("pre_auth_code");
    mockEstablishLoginCodeSession.mockResolvedValue("/home");
  });

  it("stays off outside the Feishu client", () => {
    const { result } = setup("unauthenticated", "Mozilla/5.0 Chrome/126.0");
    expect(result.current.status).toBe("off");
    expect(mockLarkAppCodeLogin).not.toHaveBeenCalled();
  });

  it("stays off while the session is unresolved or already authenticated", () => {
    const loading = setup("loading");
    expect(loading.result.current.status).toBe("off");
    const authed = setup("authenticated");
    expect(authed.result.current.status).toBe("off");
    expect(mockLarkAppCodeLogin).not.toHaveBeenCalled();
  });

  it("redeems a bound identity into a session and lands the user", async () => {
    mockLarkAppCodeLogin.mockResolvedValue({
      data: { data: { bound: true, login_code: "lc_1", provider: "lark" } },
    });
    const { result } = setup("unauthenticated");

    expect(result.current.status).toBe("running");
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/home"));
    expect(mockRequestLarkAppCode).toHaveBeenCalledWith("cli_app");
    expect(mockLarkAppCodeLogin).toHaveBeenCalledWith("pre_auth_code");
    expect(mockEstablishLoginCodeSession).toHaveBeenCalledWith("lc_1");
  });

  it("forwards an unbound identity to the register page with the pair", async () => {
    mockLarkAppCodeLogin.mockResolvedValue({
      data: {
        data: {
          bound: false,
          registration_state: "rs_1",
          oauth_state: "os_1",
          provider: "lark",
          name: "张三",
          avatar: "https://avatar",
        },
      },
    });
    const { result } = setup("unauthenticated");

    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    const target = mockReplace.mock.calls[0][0] as string;
    expect(target.startsWith("/register?")).toBe(true);
    const params = new URLSearchParams(target.split("?")[1]);
    expect(params.get("registration_state")).toBe("rs_1");
    expect(params.get("oauth_state")).toBe("os_1");
    expect(params.get("name")).toBe("张三");
    expect(params.get("avatar")).toBe("https://avatar");
    expect(mockEstablishLoginCodeSession).not.toHaveBeenCalled();
    expect(result.current.status).toBe("running");
  });

  it("surfaces a failed attempt with the backend message and retries", async () => {
    mockLarkAppCodeLogin.mockRejectedValue({
      response: { status: 403, data: { code: 40302, message: "仅限 SAST 企业用户" } },
    });
    const { result } = setup("unauthenticated");

    await waitFor(() => expect(result.current.status).toBe("failed"));
    expect(result.current.error).toBe("仅限 SAST 企业用户");

    mockLarkAppCodeLogin.mockResolvedValue({
      data: { data: { bound: true, login_code: "lc_2", provider: "lark" } },
    });
    act(() => result.current.retry());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/home"));
    expect(mockLarkAppCodeLogin).toHaveBeenCalledTimes(2);
  });

  it("fails when the response carries neither usable branch", async () => {
    mockLarkAppCodeLogin.mockResolvedValue({
      data: { data: { bound: true, provider: "lark" } },
    });
    const { result } = setup("unauthenticated");

    await waitFor(() => expect(result.current.status).toBe("failed"));
    expect(result.current.error).toBe("登录响应不完整");
  });

  it("fails with the lib message when the SDK leg throws", async () => {
    mockLoadLarkH5Sdk.mockRejectedValue(new Error("无法加载飞书 JSSDK"));
    const { result } = setup("unauthenticated");

    await waitFor(() => expect(result.current.status).toBe("failed"));
    expect(result.current.error).toBe("无法加载飞书 JSSDK");
  });
});
