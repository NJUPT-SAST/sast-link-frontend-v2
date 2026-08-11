import { render, screen } from "@testing-library/react";

import RegisterPage from "./page";

const TICKET_KEY = "sast:register-ticket";
const EMAIL_KEY = "sast:register-email";

const mockReplace = jest.fn();
let mockSearchParams: URLSearchParams;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

function setup(params = "") {
  mockSearchParams = new URLSearchParams(params);
  mockReplace.mockClear();
  sessionStorage.removeItem(TICKET_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
}

describe("RegisterPage", () => {
  it("renders the email and verification entry", () => {
    setup();
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "创建账户" })).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("验证码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "获取验证码" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续" })).toBeInTheDocument();
  });

  it("bounces back to the email step when a stored account has no ticket", () => {
    setup();
    sessionStorage.setItem(EMAIL_KEY, "alice@njupt.edu.cn");

    render(<RegisterPage />);

    // The replace to /register re-mounts from sessionStorage (now cleared), so
    // the page resets to the email step there; with a mocked router the current
    // render stays on details, so the assertion is the redirect.
    expect(mockReplace).toHaveBeenCalledWith("/register");
  });

  it("keeps the details step when an account and a ticket are stored", () => {
    setup();
    sessionStorage.setItem(EMAIL_KEY, "alice@njupt.edu.cn");
    sessionStorage.setItem(TICKET_KEY, "ticket-123");

    render(<RegisterPage />);

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
