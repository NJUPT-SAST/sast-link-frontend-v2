import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginPage from "./page";

const LOGIN_ACCOUNT_KEY = "sast:login-account";

const mockReplace = jest.fn();
let mockSearchParams: URLSearchParams;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

function setup(params = "") {
  mockSearchParams = new URLSearchParams(params);
  mockReplace.mockClear();
  sessionStorage.removeItem(LOGIN_ACCOUNT_KEY);
}

describe("LoginPage", () => {
  it("renders the auth shell with login guidance and the primary entry fields", () => {
    setup();
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByLabelText("账户")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "注册" })).toBeInTheDocument();
  });

  it("stores the account and rewrites the URL when continuing to the password step", async () => {
    setup();
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("账户"), "bob");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));

    expect(sessionStorage.getItem(LOGIN_ACCOUNT_KEY)).toBe("bob@njupt.edu.cn");
    expect(mockReplace).toHaveBeenCalledWith("/login?step=password");
    expect(screen.getByRole("heading", { name: "输入密码" })).toBeInTheDocument();
  });

  it("restores the password step from step=password and a stored account", () => {
    setup("step=password");
    sessionStorage.setItem(LOGIN_ACCOUNT_KEY, "alice@njupt.edu.cn");

    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "输入密码" })).toBeInTheDocument();
    expect(screen.getByText(/正在登录 alice@njupt\.edu\.cn/)).toBeInTheDocument();
  });

  it("falls back to the account step when step=password has no stored account", () => {
    setup("step=password");

    render(<LoginPage />);

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
  });

  it("returns to the account step via the back button", async () => {
    setup("step=password");
    sessionStorage.setItem(LOGIN_ACCOUNT_KEY, "alice@njupt.edu.cn");

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: "返回上一步" }));

    expect(sessionStorage.getItem(LOGIN_ACCOUNT_KEY)).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
  });
});
