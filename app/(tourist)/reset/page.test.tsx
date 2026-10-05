import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ResetPage from "./page";

const mockSendCode = jest.fn();
const mockResetPassword = jest.fn();

jest.mock("@/lib/api/auth", () => ({
  forgotPasswordSendCode: (...args: unknown[]) => mockSendCode(...args),
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}));

describe("ResetPage", () => {
  // The login page's hand-off is one-shot and shared across the file's jsdom
  // environment, so each test starts clean.
  beforeEach(() => {
    sessionStorage.clear();
    mockSendCode.mockReset();
    mockSendCode.mockResolvedValue({ data: { data: {} } });
    mockResetPassword.mockReset();
    mockResetPassword.mockResolvedValue({ data: { data: {} } });
  });

  it("renders the email step by default", () => {
    render(<ResetPage />);
    expect(screen.getByRole("heading", { name: "重置密码" })).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发送验证码" })).toBeInTheDocument();
  });

  it("sends the code when Enter is pressed in the email field", async () => {
    render(<ResetPage />);
    await userEvent.type(screen.getByLabelText("邮箱"), "alice{enter}");
    // A successful send swaps to the "设置新密码" step.
    expect(await screen.findByRole("heading", { name: "设置新密码" })).toBeInTheDocument();
  });

  it("pre-fills the email handed over by the login page and consumes the hand-off", async () => {
    sessionStorage.setItem("sast:reset-account", "alice@sast.fun");
    render(<ResetPage />);
    await waitFor(() => expect(screen.getByLabelText("邮箱")).toHaveValue("alice"));
    // One-shot: a later bare /reset must not resurrect a stale account.
    expect(sessionStorage.getItem("sast:reset-account")).toBeNull();
  });

  // Two synchronous clicks land before `submitting` commits, so only the ref
  // guard can keep the second submit out; a duplicate would fire the reset
  // request twice.
  it("coalesces a same-frame double click into one reset request", async () => {
    render(<ResetPage />);
    await userEvent.type(screen.getByLabelText("邮箱"), "alice{enter}");
    expect(await screen.findByRole("heading", { name: "设置新密码" })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("验证码"), "123456");
    await userEvent.type(screen.getByLabelText("新密码"), "Passw0rd!");
    await userEvent.type(screen.getByLabelText("确认新密码"), "Passw0rd!");

    const submit = screen.getByRole("button", { name: "重置密码" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(mockResetPassword).toHaveBeenCalledTimes(1));
    // Drain the second click's validation microtasks before asserting.
    await act(async () => {});
    expect(mockResetPassword).toHaveBeenCalledTimes(1);
  });
});
