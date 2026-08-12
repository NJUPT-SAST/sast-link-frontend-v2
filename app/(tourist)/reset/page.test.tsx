import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ResetPage from "./page";

describe("ResetPage", () => {
  // The login page's hand-off is one-shot and shared across the file's jsdom
  // environment, so each test starts clean.
  beforeEach(() => {
    sessionStorage.clear();
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
});
