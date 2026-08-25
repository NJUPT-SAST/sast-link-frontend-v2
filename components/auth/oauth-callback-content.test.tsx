jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams(),
}));

jest.mock("@/lib/api/oauth", () => ({
  exchangeLoginCode: (...args: unknown[]) => mockExchangeLoginCode(...args),
}));

jest.mock("@/store/use-user-list-store", () => ({
  // zustand selector form: useUserListStore((state) => state.addAccount)
  useUserListStore: () => mockAddAccount,
}));

jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader" />,
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OAuthCallbackContent } from "./oauth-callback-content";

const mockReplace = jest.fn();
const mockAddAccount = jest.fn();
const mockExchangeLoginCode = jest.fn();
let mockSearchParams: () => URLSearchParams;

const provider = { name: "GitHub", icon: null };

function setup(params: string) {
  mockSearchParams = () => new URLSearchParams(params);
  mockReplace.mockClear();
  mockAddAccount.mockClear();
  mockExchangeLoginCode.mockClear();
}

describe("OAuthCallbackContent", () => {
  it("forwards new-account callbacks to register with oauth_state intact", async () => {
    setup(
      "registration_state=rs&oauth_state=os&name=Alice&provider=github",
    );

    render(<OAuthCallbackContent provider={provider} />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    const target = mockReplace.mock.calls[0][0] as string;
    expect(target.startsWith("/register?")).toBe(true);
    const params = new URLSearchParams(target.split("?")[1]);
    expect(params.get("registration_state")).toBe("rs");
    expect(params.get("oauth_state")).toBe("os");
    expect(params.get("name")).toBe("Alice");
    expect(mockExchangeLoginCode).not.toHaveBeenCalled();
  });

  it("exchanges the login code and redirects to home", async () => {
    setup("code=lc_123");
    mockExchangeLoginCode.mockResolvedValue({
      data: {
        data: {
          access_token: "at",
          refresh_token: "rt",
          expires_in: 3600,
          user: { id: 1, name: "Alice", login_email: "a@b.com" },
        },
      },
    });

    render(<OAuthCallbackContent provider={provider} />);

    await waitFor(() => expect(mockExchangeLoginCode).toHaveBeenCalledTimes(1));
    expect(mockExchangeLoginCode).toHaveBeenCalledWith("lc_123");
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/home"));
    expect(mockAddAccount).toHaveBeenCalled();
  });

  it("shows an error when neither code nor registration_state is present", () => {
    setup("");

    render(<OAuthCallbackContent provider={provider} />);

    expect(screen.getByText(/登录链接已失效/)).toBeInTheDocument();
    expect(mockExchangeLoginCode).not.toHaveBeenCalled();
  });

  it("shows a cancellation message when the provider returns an error", () => {
    setup("error=access_denied");

    render(<OAuthCallbackContent provider={provider} />);

    expect(screen.getByText("第三方登录被取消")).toBeInTheDocument();
    // The step bar names the outcome without dressing it as a failure.
    expect(screen.getByText("登录取消")).toBeInTheDocument();
    expect(screen.queryByText("登录失败")).not.toBeInTheDocument();
    expect(screen.queryByText(/登录链接已失效/)).not.toBeInTheDocument();
    expect(mockExchangeLoginCode).not.toHaveBeenCalled();
  });

  it("retries the exchange after a transient failure", async () => {
    setup("code=lc_123");
    mockExchangeLoginCode
      .mockRejectedValueOnce({ message: "boom" })
      .mockResolvedValueOnce({
        data: {
          data: {
            access_token: "at",
            refresh_token: "rt",
            expires_in: 3600,
            user: { id: 1, name: "Alice", login_email: "a@b.com" },
          },
        },
      });

    render(<OAuthCallbackContent provider={provider} />);

    expect(await screen.findByText(/登录链接已失效/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "重新尝试" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/home"));
    expect(mockExchangeLoginCode).toHaveBeenCalledTimes(2);
  });
});
