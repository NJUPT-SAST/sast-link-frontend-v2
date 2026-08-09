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
