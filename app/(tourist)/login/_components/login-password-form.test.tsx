import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { passwordLogin } from "@/lib/api/auth";
import LoginPasswordForm from "./login-password-form";

jest.mock("@/lib/api/auth", () => ({ passwordLogin: jest.fn() }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn() }) }));

const authData = { data: { data: { access_token: "access", refresh_token: "refresh", expires_in: 3600, token_type: "Bearer", user: { id: 1, login_email: "alice@njupt.edu.cn", name: "Alice", role: "member", state: "on_sast", email_type: "njupt_email", created_at: "2026-01-01T00:00:00Z" } } } };

describe("LoginPasswordForm", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("logs in with email and password", async () => {
    (passwordLogin as jest.Mock).mockResolvedValue(authData);
    render(<LoginPasswordForm loginEmail="alice@njupt.edu.cn" onBack={jest.fn()} />);
    await userEvent.type(screen.getByLabelText("密码"), "Password123");
    await userEvent.click(screen.getByRole("button", { name: "登录 SAST Link" }));
    await waitFor(() => expect(passwordLogin).toHaveBeenCalledWith("alice@njupt.edu.cn", "Password123"));
  });

  it("shows the migration notice with a reset-password link that never carries the account in the URL", () => {
    render(<LoginPasswordForm loginEmail="alice@njupt.edu.cn" onBack={jest.fn()} />);
    expect(screen.getByText(/由于信息迁移/)).toBeInTheDocument();
    // The email must not appear in the query string (URLs leak into history,
    // Referer headers and server logs), so the link is a bare /reset.
    const resetLink = screen.getByRole("link", { name: "重置密码" });
    expect(resetLink.getAttribute("href")).toBe("/reset");
    expect(resetLink.getAttribute("href")).not.toContain("alice@");
  });

  it("hands the typed account to /reset via sessionStorage when reset is clicked", async () => {
    render(<LoginPasswordForm loginEmail="alice@njupt.edu.cn" onBack={jest.fn()} />);
    await userEvent.click(screen.getByRole("link", { name: "重置密码" }));
    // The email travels via storage, never a URL, so the reset form can
    // pre-fill it.
    expect(sessionStorage.getItem("sast:reset-account")).toBe("alice@njupt.edu.cn");
  });
});
