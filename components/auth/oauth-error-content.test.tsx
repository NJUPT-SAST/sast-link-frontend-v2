jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));

import { render, screen } from "@testing-library/react";
import { OAuthErrorContent } from "./oauth-error-content";

let mockSearchParams: () => URLSearchParams;

function setup(params: string) {
  mockSearchParams = () => new URLSearchParams(params);
}

describe("OAuthErrorContent", () => {
  it("shows the backend description verbatim and offers the way back", () => {
    setup("error=40000&error_description=state+%E6%97%A0%E6%95%88%E6%88%96%E5%B7%B2%E8%BF%87%E6%9C%9F%EF%BC%8C%E8%AF%B7%E9%87%8D%E6%96%B0%E7%99%BB%E5%BD%95");
    render(<OAuthErrorContent />);

    expect(screen.getByText("第三方登录失败")).toBeInTheDocument();
    expect(
      screen.getByText(/state 无效或已过期，请重新登录/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("oauth-error-code")).toHaveTextContent("错误码 40000");
    expect(screen.getByRole("link", { name: "返回登录" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("falls back to the generic line when only the code arrives, and keeps it", () => {
    setup("error=40302");
    render(<OAuthErrorContent />);

    // The backend owns the copy; a code-only link (hand-edited or truncated)
    // gets the generic reason plus the terminal advice for this code.
    expect(screen.getByText(/第三方登录未能完成/)).toBeInTheDocument();
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

    expect(screen.getByText(/第三方登录未能完成/)).toBeInTheDocument();
    expect(screen.queryByTestId("oauth-error-code")).not.toBeInTheDocument();
  });
});
