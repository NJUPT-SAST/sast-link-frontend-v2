import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginAccountField } from "./login-account-field";

describe("LoginAccountField", () => {
  it("renders the default domain and accepts prefix input", () => {
    const onChange = jest.fn();
    render(
      <LoginAccountField
        value={{ localPart: "", domain: "@njupt.edu.cn" }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("button", { name: "选择邮箱域名" })).toHaveTextContent(
      "@njupt.edu.cn",
    );
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
  }, 20000);

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

  it("uses reset copy for the hint when context=reset", () => {
    render(
      <LoginAccountField
        value={{ localPart: "alice", domain: "@njupt.edu.cn" }}
        onChange={jest.fn()}
        context="reset"
      />,
    );
    expect(screen.getByText("将发送验证码到 alice@njupt.edu.cn")).toBeInTheDocument();
  });

  it("hides the domain pill once the input contains an @", () => {
    render(
      <LoginAccountField
        value={{ localPart: "alice@gmail.com", domain: "@njupt.edu.cn" }}
        onChange={jest.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "选择邮箱域名" })).not.toBeInTheDocument();
  });

  it("switches to full-address mode when an @ is typed", () => {
    const onChange = jest.fn();
    render(
      <LoginAccountField
        value={{ localPart: "bob", domain: "@njupt.edu.cn" }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("账户"), { target: { value: "bob@sast.fun" } });
    expect(onChange).toHaveBeenCalledWith({
      localPart: "bob@sast.fun",
      domain: "其他邮箱",
    });
  });
});
