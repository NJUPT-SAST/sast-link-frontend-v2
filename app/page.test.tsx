import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

const mockGetSession = jest.fn();
jest.mock("@/lib/token", () => ({
  getSession: () => mockGetSession(),
  setSession: jest.fn(),
  createSession: jest.fn(),
  clearSession: jest.fn(),
}));

const mockLarkLogin = {
  status: "off" as "off" | "running" | "failed",
  error: null as string | null,
  retry: jest.fn(),
};
jest.mock("@/hooks/use-lark-h5-auto-login", () => ({
  useLarkH5AutoLogin: () => mockLarkLogin,
}));

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockReturnValue(null);
    mockLarkLogin.status = "off";
    mockLarkLogin.error = null;
  });

  it("renders nothing and bounces signed-in users straight to /home (no landing flash)", async () => {
    mockGetSession.mockReturnValue({ accessToken: "a", expiresAt: 1 });
    render(<Home />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/home"));
    expect(screen.queryByRole("heading", { name: "SAST Link" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "登录" })).not.toBeInTheDocument();
  });

  it("shows the starfield landing with login and register entry when signed out", async () => {
    render(<Home />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: "SAST Link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "登录" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "注册" })).toHaveAttribute("href", "/register");
  });

  it("keeps the cover up (no landing flash) while the in-client login runs", async () => {
    mockLarkLogin.status = "running";
    render(<Home />);

    // Give the session resolution a beat; the landing must stay hidden.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole("heading", { name: "SAST Link" })).not.toBeInTheDocument();
    expect(screen.getByTestId("lark-login-cover")).toBeInTheDocument();
  });

  it("shows the landing with an error banner and retry once the in-client login failed", async () => {
    mockLarkLogin.status = "failed";
    mockLarkLogin.error = "仅限 SAST 企业用户";
    render(<Home />);

    expect(await screen.findByRole("heading", { name: "SAST Link" })).toBeInTheDocument();
    expect(screen.getByTestId("lark-login-error")).toHaveTextContent(
      "飞书登录失败：仅限 SAST 企业用户",
    );
    await userEvent.click(screen.getByRole("button", { name: "重试飞书登录" }));
    expect(mockLarkLogin.retry).toHaveBeenCalled();
    // The ordinary entrances stay reachable — the failure is not a dead end.
    expect(screen.getByRole("link", { name: "登录" })).toBeInTheDocument();
  });
});
