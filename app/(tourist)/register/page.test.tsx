import { render, screen } from "@testing-library/react";

import RegisterPage from "./page";

describe("RegisterPage", () => {
  it("renders the email and verification entry", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "创建账户" })).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("验证码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "获取验证码" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续" })).toBeInTheDocument();
  });
});
