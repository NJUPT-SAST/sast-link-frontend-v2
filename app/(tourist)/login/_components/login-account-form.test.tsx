import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginAccountForm from "./login-account-form";

jest.mock(
  "next/link",
  () =>
    function Link({ children }: { children: React.ReactNode }) {
      return <>{children}</>;
    },
);

describe("LoginAccountForm", () => {
  it("submits a lowercased student id with the default njupt domain", async () => {
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await userEvent.type(screen.getByLabelText("账户"), "B24040001");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("b24040001@njupt.edu.cn");
  });

  it("lowercases an uppercase email prefix before submitting", async () => {
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await userEvent.type(screen.getByLabelText("账户"), "Alice");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("alice@njupt.edu.cn");
  });

  it("submits an arbitrary prefix when sast.fun is selected", async () => {
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await userEvent.click(screen.getByRole("button", { name: "选择邮箱域名" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "@sast.fun" }));
    await userEvent.type(screen.getByLabelText("账户"), "foo");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("foo@sast.fun");
  });

  it("submits an arbitrary prefix with the default njupt domain", async () => {
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await userEvent.type(screen.getByLabelText("账户"), "alice");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("alice@njupt.edu.cn");
  });

  it("submits a full email as-is when the other-email domain is selected", async () => {
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await userEvent.click(screen.getByRole("button", { name: "选择邮箱域名" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "其他邮箱" }));
    await userEvent.type(screen.getByLabelText("账户"), "alice@sast.fun");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("alice@sast.fun");
  });

  it("submits any valid email in the other-email branch (other_mail login)", async () => {
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await userEvent.click(screen.getByRole("button", { name: "选择邮箱域名" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "其他邮箱" }));
    await userEvent.type(screen.getByLabelText("账户"), "alice@example.com");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("alice@example.com");
  });

  it("rejects malformed emails in the other-email branch", async () => {
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await userEvent.click(screen.getByRole("button", { name: "选择邮箱域名" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "其他邮箱" }));
    await userEvent.type(screen.getByLabelText("账户"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByText("请输入完整的邮箱地址")).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });
});
