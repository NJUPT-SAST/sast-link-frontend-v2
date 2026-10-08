jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));

jest.mock("@/lib/api/oauth", () => ({
  beginOAuthLogin: jest.fn().mockResolvedValue(undefined),
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beginOAuthLogin } from "@/lib/api/oauth";
import { OAuthErrorContent } from "./oauth-error-content";

let mockSearchParams: () => URLSearchParams;

function setup(params: string) {
  mockSearchParams = () => new URLSearchParams(params);
}

describe("OAuthErrorContent", () => {
  it("shows the backend description verbatim and offers the way back", () => {
    setup("error=40000&error_description=%E7%99%BB%E5%BD%95%E5%B7%B2%E4%B8%AD%E6%96%AD%EF%BC%8C%E8%AF%B7%E9%87%8D%E6%96%B0%E5%8F%91%E8%B5%B7%E7%99%BB%E5%BD%95");
    render(<OAuthErrorContent />);

    expect(screen.getByText("第三方登录失败")).toBeInTheDocument();
    expect(
      screen.getByText(/登录已中断，请重新发起登录。请稍后重试或换用其他登录方式。/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("oauth-error-code")).toHaveTextContent("错误码 40000");
    expect(screen.getByRole("link", { name: "返回登录" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders only the advice line when only the code arrives", () => {
    setup("error=40302");
    render(<OAuthErrorContent />);

    // The backend owns the copy; a code-only link (hand-edited or truncated)
    // gets just the terminal advice for this code — the h1 already says the
    // login failed, so repeating it would be noise.
    expect(screen.queryByText(/第三方登录未能完成/)).not.toBeInTheDocument();
    expect(screen.getByText(/请联系管理员/)).toBeInTheDocument();
    expect(screen.getByTestId("oauth-error-code")).toHaveTextContent("错误码 40302");
  });

  it("tells a retryable failure to try again, and a terminal one not to", () => {
    setup("error=50300");
    const { unmount } = render(<OAuthErrorContent />);
    expect(screen.getByText(/请稍后重试或换用其他登录方式/)).toBeInTheDocument();
    unmount();

    setup("error=40301");
    render(<OAuthErrorContent />);
    expect(screen.getByText(/请联系管理员/)).toBeInTheDocument();
  });

  it("stays useful when the callback carries no query at all", () => {
    setup("");
    render(<OAuthErrorContent />);

    expect(screen.queryByText(/第三方登录未能完成/)).not.toBeInTheDocument();
    expect(screen.getByText(/请稍后重试或换用其他登录方式/)).toBeInTheDocument();
    expect(screen.queryByTestId("oauth-error-code")).not.toBeInTheDocument();
  });

  it("treats an empty ?error= like a missing one, on the retryable path", () => {
    setup("error=");
    render(<OAuthErrorContent />);

    expect(screen.getByText(/请稍后重试或换用其他登录方式/)).toBeInTheDocument();
    expect(screen.queryByText(/请联系管理员/)).not.toBeInTheDocument();
  });

  it("offers a one-click restart when the backend names the provider", async () => {
    setup("error=40000&error_description=%E7%99%BB%E5%BD%95%E5%B7%B2%E4%B8%AD%E6%96%AD&provider=github");
    render(<OAuthErrorContent />);

    const restart = screen.getByRole("link", { name: "重试 GitHub 登录" });
    // The restart builds its target at click time (fresh PKCE challenge), so
    // the anchor carries no backend href — it launches via the module call.
    expect(restart).toHaveAttribute("href", "#");
    await userEvent.click(restart);
    expect(beginOAuthLogin).toHaveBeenCalledWith("github");
    // The way back to the password flow stays available as the secondary action.
    expect(screen.getByRole("link", { name: "返回登录" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("labels the restart button per provider (lark)", async () => {
    setup("error=50300&provider=lark");
    render(<OAuthErrorContent />);

    const restart = screen.getByRole("link", { name: "重试飞书登录" });
    await userEvent.click(restart);
    expect(beginOAuthLogin).toHaveBeenCalledWith("lark");
  });

  it("degrades to the plain display for an unknown provider", () => {
    setup("error=40000&provider=google");
    render(<OAuthErrorContent />);

    expect(screen.queryByRole("link", { name: /重试/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回登录" })).toBeInTheDocument();
  });
});
