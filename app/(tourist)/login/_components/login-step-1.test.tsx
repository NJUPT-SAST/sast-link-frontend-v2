import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginStep1 from "./login-step-1";

jest.mock(
  "next/link",
  () =>
    function Link({ children }: { children: React.ReactNode }) {
      return <>{children}</>;
    },
);

describe("LoginStep1", () => {
  it("submits a student id with the default njupt domain", async () => {
    const onNext = jest.fn();
    render(<LoginStep1 onNext={onNext} />);
    await userEvent.type(screen.getByLabelText("账户"), "B24040001");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("B24040001@njupt.edu.cn");
  });

  it("submits an arbitrary prefix when sast.fun is selected", async () => {
    const onNext = jest.fn();
    render(<LoginStep1 onNext={onNext} />);
    await userEvent.click(screen.getByRole("button", { name: "选择邮箱域名" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "@sast.fun" }));
    await userEvent.type(screen.getByLabelText("账户"), "foo");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("foo@sast.fun");
  });

  it("submits an arbitrary prefix with the default njupt domain", async () => {
    const onNext = jest.fn();
    render(<LoginStep1 onNext={onNext} />);
    await userEvent.type(screen.getByLabelText("账户"), "alice");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("alice@njupt.edu.cn");
  });
});
