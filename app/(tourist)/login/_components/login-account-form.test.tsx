import { render, screen, waitFor } from "@testing-library/react";
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
  // The remembered-account store is shared across the file's jsdom environment:
  // one test's submit persists it, so every later test would start pre-filled.
  beforeEach(() => {
    localStorage.clear();
  });

  it("submits a lowercased student id with the default njupt domain", async () => {
    const user = userEvent.setup();
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await user.type(screen.getByLabelText("账户"), "B24040001");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("b24040001@njupt.edu.cn");
  });

  it("lowercases an uppercase email prefix before submitting", async () => {
    const user = userEvent.setup();
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await user.type(screen.getByLabelText("账户"), "Alice");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("alice@njupt.edu.cn");
  });

  it("submits an arbitrary prefix when sast.fun is selected", async () => {
    const user = userEvent.setup();
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    const trigger = screen.getByRole("button", { name: "选择邮箱域名" });
    await user.click(trigger);

    const sastFunOption = await waitFor(
      () => {
        const item = screen.queryByRole("menuitem", { name: "@sast.fun" });
        if (!item) throw new Error("Menu item not found");
        return item;
      },
      { timeout: 15000, interval: 100 }
    );

    await user.click(sastFunOption);
    await user.type(screen.getByLabelText("账户"), "foo");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("foo@sast.fun");
  }, 60000);

  it("submits an arbitrary prefix with the default njupt domain", async () => {
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    await userEvent.type(screen.getByLabelText("账户"), "alice");
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("alice@njupt.edu.cn");
  });

  it("submits a full email as-is when the other-email domain is selected", async () => {
    const user = userEvent.setup();
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    const trigger = screen.getByRole("button", { name: "选择邮箱域名" });
    await user.click(trigger);

    const otherOption = await waitFor(
      () => {
        const item = screen.queryByRole("menuitem", { name: "其他邮箱" });
        if (!item) throw new Error("Menu item not found");
        return item;
      },
      { timeout: 15000, interval: 100 }
    );

    await user.click(otherOption);
    await user.type(screen.getByLabelText("账户"), "alice@sast.fun");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("alice@sast.fun");
  }, 60000);

  it("submits any valid email in the other-email branch (other_mail login)", async () => {
    const user = userEvent.setup();
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    const trigger = screen.getByRole("button", { name: "选择邮箱域名" });
    await user.click(trigger);

    const otherOption = await waitFor(
      () => {
        const item = screen.queryByRole("menuitem", { name: "其他邮箱" });
        if (!item) throw new Error("Menu item not found");
        return item;
      },
      { timeout: 15000, interval: 100 }
    );

    await user.click(otherOption);
    await user.type(screen.getByLabelText("账户"), "alice@example.com");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("alice@example.com");
  }, 60000);

  it("rejects malformed emails in the other-email branch", async () => {
    const user = userEvent.setup();
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    const trigger = screen.getByRole("button", { name: "选择邮箱域名" });
    await user.click(trigger);

    const otherOption = await waitFor(
      () => {
        const item = screen.queryByRole("menuitem", { name: "其他邮箱" });
        if (!item) throw new Error("Menu item not found");
        return item;
      },
      { timeout: 15000, interval: 100 }
    );

    await user.click(otherOption);
    await user.type(screen.getByLabelText("账户"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByText("请输入完整的邮箱地址")).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  }, 60000);

  it("remembers the submitted account with its domain type", async () => {
    const user = userEvent.setup();
    const onNext = jest.fn();
    render(<LoginAccountForm onNext={onNext} />);
    const trigger = screen.getByRole("button", { name: "选择邮箱域名" });
    await user.click(trigger);

    const sastFunOption = await waitFor(
      () => {
        const item = screen.queryByRole("menuitem", { name: "@sast.fun" });
        if (!item) throw new Error("Menu item not found");
        return item;
      },
      { timeout: 15000, interval: 100 }
    );

    await user.click(sastFunOption);
    await user.type(screen.getByLabelText("账户"), "foo");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(onNext).toHaveBeenCalledWith("foo@sast.fun");
    const stored = JSON.parse(localStorage.getItem("sast:last-login-account") || "{}");
    expect(stored).toEqual({ localPart: "foo", domain: "@sast.fun" });
  }, 60000);

  it("pre-fills the account field from the remembered entry", () => {
    localStorage.setItem(
      "sast:last-login-account",
      JSON.stringify({ localPart: "alice", domain: "@sast.fun" }),
    );
    render(<LoginAccountForm onNext={jest.fn()} />);
    expect(screen.getByLabelText("账户")).toHaveValue("alice");
  });
});
