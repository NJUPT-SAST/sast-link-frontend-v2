jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams(),
}));

jest.mock("@/lib/login-session", () => ({
  establishLoginCodeSession: (...args: unknown[]) =>
    mockEstablishLoginCodeSession(...args),
}));

jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader" />,
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OAuthCallbackContent } from "./oauth-callback-content";

const mockReplace = jest.fn();
const mockEstablishLoginCodeSession = jest.fn();
let mockSearchParams: () => URLSearchParams;

const provider = { name: "GitHub", icon: null };

// Mirrors the sessionStorage stamp the login buttons write at click time
// (see markOAuthLoginInitiated); the exchange path only runs with it present.
const LOGIN_INITIATED_KEY = "sast:oauth-login-init:github";

function seedLoginInitiation() {
  sessionStorage.setItem(LOGIN_INITIATED_KEY, String(Date.now()));
}

function setup(params: string) {
  mockSearchParams = () => new URLSearchParams(params);
  mockReplace.mockClear();
  mockEstablishLoginCodeSession.mockReset();
  mockEstablishLoginCodeSession.mockResolvedValue("/home");
}

describe("OAuthCallbackContent", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

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
    expect(mockEstablishLoginCodeSession).not.toHaveBeenCalled();
  });

  it("exchanges the login code and redirects to home", async () => {
    setup("code=lc_123");
    seedLoginInitiation();
    mockEstablishLoginCodeSession.mockResolvedValue("/home");

    render(<OAuthCallbackContent provider={provider} />);

    await waitFor(() =>
      expect(mockEstablishLoginCodeSession).toHaveBeenCalledTimes(1),
    );
    expect(mockEstablishLoginCodeSession).toHaveBeenCalledWith("lc_123");
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/home"));
  });

  it("shows an error when neither code nor registration_state is present", () => {
    setup("");

    render(<OAuthCallbackContent provider={provider} />);

    expect(screen.getByText(/登录链接已失效/)).toBeInTheDocument();
    expect(mockEstablishLoginCodeSession).not.toHaveBeenCalled();
  });

  it("shows a cancellation message when the provider returns an error", () => {
    setup("error=access_denied");

    render(<OAuthCallbackContent provider={provider} />);

    expect(screen.getByText("第三方登录被取消")).toBeInTheDocument();
    // The step bar names the outcome without dressing it as a failure.
    expect(screen.getByText("登录取消")).toBeInTheDocument();
    expect(screen.queryByText("登录失败")).not.toBeInTheDocument();
    expect(screen.queryByText(/登录链接已失效/)).not.toBeInTheDocument();
    expect(mockEstablishLoginCodeSession).not.toHaveBeenCalled();
  });

  it("retries the exchange after a transient failure", async () => {
    setup("code=lc_123");
    seedLoginInitiation();
    mockEstablishLoginCodeSession
      .mockRejectedValueOnce({ message: "boom" })
      .mockResolvedValueOnce("/home");

    render(<OAuthCallbackContent provider={provider} />);

    expect(await screen.findByText(/登录链接已失效/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "重新尝试" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/home"));
    expect(mockEstablishLoginCodeSession).toHaveBeenCalledTimes(2);
  });

  it("stops the auto exchange when this tab did not initiate the login", async () => {
    setup("code=lc_123");

    render(<OAuthCallbackContent provider={provider} />);

    expect(await screen.findByText("登录已停止")).toBeInTheDocument();
    expect(
      screen.getByText(/该链接不是从本站发起的登录/),
    ).toBeInTheDocument();
    expect(mockEstablishLoginCodeSession).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "返回登录" }));
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("strips the login code from the URL once it has been read", async () => {
    setup("code=lc_123");
    seedLoginInitiation();
    const replaceStateSpy = jest.spyOn(window.history, "replaceState");

    render(<OAuthCallbackContent provider={provider} />);

    await waitFor(() =>
      expect(mockEstablishLoginCodeSession).toHaveBeenCalledTimes(1),
    );
    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/oauth/callback");
    replaceStateSpy.mockRestore();
  });
});
