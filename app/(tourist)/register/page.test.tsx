import { render, screen } from "@testing-library/react";

import RegisterPage from "./page";

describe("RegisterPage", () => {
  it("renders the email registration entry", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "创建账户" })).toBeInTheDocument();
    expect(screen.getByText("使用南邮邮箱或 SAST 邮箱注册。")).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发送验证码" })).toBeInTheDocument();
  });
});
