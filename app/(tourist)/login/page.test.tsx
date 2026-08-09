import { render, screen } from "@testing-library/react";

import LoginPage from "./page";

describe("LoginPage", () => {
  it("renders the auth shell with login guidance and the primary entry fields", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "登录" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("账户")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "继续" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "注册" })).toBeInTheDocument();
  });
});
