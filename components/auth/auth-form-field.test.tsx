import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthFormField } from "./auth-form-field";

describe("AuthFormField password visibility", () => {
  it("keeps a persistent visibility toggle for password fields", async () => {
    const user = userEvent.setup();
    render(<AuthFormField label="密码" type="password" defaultValue="secret" />);

    const input = screen.getByLabelText("密码");
    expect(input).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: "显示密码" });
    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("secret");

    await user.click(screen.getByRole("button", { name: "隐藏密码" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("does not render a visibility toggle for non-password fields", () => {
    render(<AuthFormField label="账户" type="email" />);

    expect(screen.queryByRole("button", { name: /密码/ })).not.toBeInTheDocument();
  });
});

describe("AuthFormField error and description semantics", () => {
  it("links the input to a role=alert message node when an error is set", () => {
    render(<AuthFormField id="pwd" label="密码" type="password" error="出错了" invalid />);

    const input = screen.getByLabelText("密码");
    expect(input).toHaveAttribute("aria-describedby", "pwd-message");
    const message = document.getElementById("pwd-message");
    expect(message).toHaveAttribute("role", "alert");
    expect(message).toHaveTextContent("出错了");
  });

  it("lists both description and message ids in aria-describedby", () => {
    render(
      <AuthFormField
        id="reset-code"
        label="验证码"
        description="6 位数字"
        error="验证码错误"
      />,
    );

    expect(screen.getByLabelText("验证码")).toHaveAttribute(
      "aria-describedby",
      "reset-code-description reset-code-message",
    );
  });

  it("omits aria-describedby when there is no error or description", () => {
    render(<AuthFormField id="plain" label="账户" />);

    expect(screen.getByLabelText("账户")).not.toHaveAttribute("aria-describedby");
  });
});
