import { render, screen } from "@testing-library/react";

import RegisterPage from "./page";

const TICKET_KEY = "sast:register-ticket";

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

  it("bounces back to the email step when landing on details without a ticket", () => {
    setup("phase=details&email=alice@njupt.edu.cn");

    render(<RegisterPage />);

    expect(mockReplace).toHaveBeenCalledWith("/register");
  });

  it("keeps the details step when a ticket is present", () => {
    setup("phase=details&email=alice@njupt.edu.cn");
    sessionStorage.setItem(TICKET_KEY, "ticket-123");

    render(<RegisterPage />);

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
