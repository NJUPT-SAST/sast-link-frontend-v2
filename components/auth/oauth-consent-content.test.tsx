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
}));

jest.mock("@/lib/api/redirect", () => ({
  redirectTo: (url: string) => mockRedirectTo(url),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OAuthConsentContent } from "./oauth-consent-content";

const mockConsentAuthorize = jest.fn();
const mockRedirectTo = jest.fn();
let mockSearchParams: () => URLSearchParams;

function setup(params: string) {
  mockSearchParams = () => new URLSearchParams(params);
  mockConsentAuthorize.mockClear();
  mockRedirectTo.mockClear();
}

describe("OAuthConsentContent", () => {
  it("shows the app name and the requested scopes", () => {
    setup("request_id=ar_123&client_name=Evento&scope=openid profile email&expires_in=600");
    render(<OAuthConsentContent />);

    expect(screen.getByRole("heading", { name: "Evento" })).toBeInTheDocument();
    expect(screen.getByText("身份标识（OpenID）")).toBeInTheDocument();
    expect(screen.getByText("基本资料（昵称、姓名、签名等）")).toBeInTheDocument();
    expect(screen.getByText("邮箱地址")).toBeInTheDocument();
    expect(screen.getByText("此请求将在 10 分钟后过期")).toBeInTheDocument();
  });

  it("approves the request and navigates to the client redirect_uri", async () => {
    setup("request_id=ar_123&client_name=Evento&scope=openid");
    mockConsentAuthorize.mockResolvedValue({
      data: { data: { redirect_uri: "https://evento.sast.fun/oauth?code=abc&state=xyz" } },
    });

    render(<OAuthConsentContent />);
    fireEvent.click(screen.getByRole("button", { name: "授权登录" }));

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
    setup("request_id=ar_123&client_name=Evento&scope=openid");
    mockConsentAuthorize.mockResolvedValue({
      data: { data: { redirect_uri: "https://evento.sast.fun/oauth?error=access_denied" } },
    });

    render(<OAuthConsentContent />);
    fireEvent.click(screen.getByRole("button", { name: "拒绝" }));

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
  });

  it("shows an empty state when no request_id is present", () => {
    setup("");
    render(<OAuthConsentContent />);

    expect(screen.getByRole("heading", { name: "没有待处理的授权请求" })).toBeInTheDocument();
  });

  it("surfaces a consent API failure", async () => {
    setup("request_id=ar_123&client_name=Evento&scope=openid");
    mockConsentAuthorize.mockRejectedValue({
      response: { data: { code: 400, message: "授权请求已过期" } },
    });

    render(<OAuthConsentContent />);
    fireEvent.click(screen.getByRole("button", { name: "授权登录" }));

    await waitFor(() => {
      expect(screen.getByText("授权请求已过期")).toBeInTheDocument();
    });
  });
});
