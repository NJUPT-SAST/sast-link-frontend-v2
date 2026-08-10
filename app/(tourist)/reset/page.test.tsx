import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ResetPage from "./page";

describe("ResetPage", () => {
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
});
