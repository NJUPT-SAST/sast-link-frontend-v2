jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));

jest.mock("next/link", () => {
  const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  return Link;
});

jest.mock("@/lib/api/oauth", () => ({
  consentAuthorize: (...args: unknown[]) => mockConsentAuthorize(...args),
  getConsentInfo: (...args: unknown[]) => mockGetConsentInfo(...args),
}));

jest.mock("@/lib/api/redirect", () => ({
  redirectTo: (url: string) => mockRedirectTo(url),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OAuthConsentContent } from "./oauth-consent-content";

const mockConsentAuthorize = jest.fn();
const mockGetConsentInfo = jest.fn();
const mockRedirectTo = jest.fn();
let mockSearchParams: () => URLSearchParams;

function setup(params: string) {
  mockSearchParams = () => new URLSearchParams(params);
  mockConsentAuthorize.mockClear();
  mockGetConsentInfo.mockClear();
  mockRedirectTo.mockClear();
  // Default: a valid pending request whose verified metadata comes from the
  // backend — the URL carries only the opaque request_id.
  mockGetConsentInfo.mockResolvedValue({
    data: {
      data: {
        client_name: "Evento",
        scopes: ["openid", "profile", "email"],
        expires_in: 600,
      },
    },
  });
}

describe("OAuthConsentContent", () => {
  it("shows a loading hint while fetching the consent info", () => {
    setup("request_id=ar_123");
    mockGetConsentInfo.mockImplementation(() => new Promise(() => {}));

    render(<OAuthConsentContent />);

    expect(screen.getByText("正在加载授权信息…")).toBeInTheDocument();
  });

  it("shows the verified app name and scopes fetched from the backend", async () => {
    setup("request_id=ar_123");
    render(<OAuthConsentContent />);

    expect(await screen.findByRole("heading", { name: "Evento" })).toBeInTheDocument();
    expect(screen.getByText("openid · 身份标识（OpenID）")).toBeInTheDocument();
    expect(screen.getByText("profile · 基本资料（昵称、姓名、签名等）")).toBeInTheDocument();
    expect(screen.getByText("email · 邮箱地址")).toBeInTheDocument();
    expect(screen.getByText("此请求将在 10 分钟后过期")).toBeInTheDocument();
    expect(mockGetConsentInfo).toHaveBeenCalledWith("ar_123");
  });

  it("does not render app name or scopes from the URL", async () => {
    // A forged link may carry a spoofed client_name/scope — they must be ignored.
    setup("request_id=ar_123&client_name=Google&scope=email&expires_in=999999");
    mockGetConsentInfo.mockResolvedValue({
      data: { data: { client_name: "Evento", scopes: ["openid"], expires_in: 600 } },
    });
    render(<OAuthConsentContent />);

    expect(await screen.findByRole("heading", { name: "Evento" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Google" })).not.toBeInTheDocument();
    expect(screen.queryByText("此请求将在 999999 分钟后过期")).not.toBeInTheDocument();
  });

  it("approves the request and navigates to the client redirect_uri", async () => {
    setup("request_id=ar_123");
    mockConsentAuthorize.mockResolvedValue({
      data: { data: { redirect_uri: "https://evento.sast.fun/oauth?code=abc&state=xyz" } },
    });

    render(<OAuthConsentContent />);
    fireEvent.click(await screen.findByRole("button", { name: "授权登录" }));

    await waitFor(() => {
      expect(mockConsentAuthorize).toHaveBeenCalledWith("ar_123", true);
    });
    await waitFor(() => {
      expect(mockRedirectTo).toHaveBeenCalledWith(
        "https://evento.sast.fun/oauth?code=abc&state=xyz",
      );
    });
  });

  it("rejects with approve=false", async () => {
    setup("request_id=ar_123");
    mockConsentAuthorize.mockResolvedValue({
      data: { data: { redirect_uri: "https://evento.sast.fun/oauth?error=access_denied" } },
    });

    render(<OAuthConsentContent />);
    fireEvent.click(await screen.findByRole("button", { name: "拒绝" }));

    await waitFor(() => {
      expect(mockConsentAuthorize).toHaveBeenCalledWith("ar_123", false);
    });
  });

  it("shows an error state when the backend rejected the authorize request", () => {
    setup("error=invalid_request&error_description=redirect_uri 不匹配");
    render(<OAuthConsentContent />);

    expect(screen.getByRole("heading", { name: "授权请求无效" })).toBeInTheDocument();
    expect(screen.getByText("redirect_uri 不匹配")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "授权登录" })).not.toBeInTheDocument();
    expect(mockGetConsentInfo).not.toHaveBeenCalled();
  });

  it("shows an empty state when no request_id is present", () => {
    setup("");
    render(<OAuthConsentContent />);

    expect(screen.getByRole("heading", { name: "没有待处理的授权请求" })).toBeInTheDocument();
  });

  it("shows an error state when the pending request is invalid or expired", async () => {
    setup("request_id=ar_999");
    mockGetConsentInfo.mockRejectedValue(new Error("not found"));
    render(<OAuthConsentContent />);

    expect(await screen.findByRole("heading", { name: "授权请求无效" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "授权登录" })).not.toBeInTheDocument();
  });

  it("surfaces a consent API failure", async () => {
    setup("request_id=ar_123");
    mockConsentAuthorize.mockRejectedValue({
      response: { data: { code: 400, message: "授权请求已过期" } },
    });

    render(<OAuthConsentContent />);
    fireEvent.click(await screen.findByRole("button", { name: "授权登录" }));

    await waitFor(() => {
      expect(screen.getByText("授权请求已过期")).toBeInTheDocument();
    });
  });
});
