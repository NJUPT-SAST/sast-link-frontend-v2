import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginAccountField } from "./login-account-field";

describe("LoginAccountField", () => {
  it("renders the default domain and accepts prefix input", async () => {
    const onChange = jest.fn();
    render(
      <LoginAccountField
        value={{ localPart: "", domain: "@njupt.edu.cn" }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("button", { name: "选择邮箱域名" })).toHaveTextContent("@njupt.edu.cn");
    fireEvent.change(screen.getByLabelText("账户"), { target: { value: "B24040001" } });
    expect(onChange).toHaveBeenCalledWith({
      localPart: "B24040001",
      domain: "@njupt.edu.cn",
    });
  });

  it("switches domain via the dropdown", async () => {
    const onChange = jest.fn();
    render(
      <LoginAccountField
        value={{ localPart: "foo", domain: "@njupt.edu.cn" }}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "选择邮箱域名" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "@sast.fun" }));
    expect(onChange).toHaveBeenLastCalledWith({
      localPart: "foo",
      domain: "@sast.fun",
    });
  });

  it("displays an error message", () => {
    render(
      <LoginAccountField
        value={{ localPart: "", domain: "@njupt.edu.cn" }}
        onChange={jest.fn()}
        error="请输入 9 位学号"
      />,
    );
    expect(screen.getByText("请输入 9 位学号")).toBeInTheDocument();
  });

  it("shows the resolved full email preview when typing a prefix", () => {
    render(
      <LoginAccountField
        value={{ localPart: "alice", domain: "@njupt.edu.cn" }}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("将使用 alice@njupt.edu.cn 继续")).toBeInTheDocument();
  });

  it("shows the resolved domain when typing @suffix", () => {
    render(
      <LoginAccountField
        value={{ localPart: "bob@sast.fun", domain: "@njupt.edu.cn" }}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("将使用 bob@sast.fun 继续")).toBeInTheDocument();
  });
});
