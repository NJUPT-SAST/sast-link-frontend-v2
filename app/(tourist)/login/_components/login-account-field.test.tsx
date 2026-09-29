import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginAccountField, type LoginAccountFieldProps } from "./login-account-field";

type AccountValue = LoginAccountFieldProps["value"];

/** The real parents are controlled components; a stateful harness keeps the
 *  typed characters visible the way the forms render them. */
function StatefulField({
  initial = { localPart: "", domain: "@njupt.edu.cn" },
  ...props
}: { initial?: AccountValue } & Partial<LoginAccountFieldProps>) {
  const [value, setValue] = useState<AccountValue>(initial);
  return (
    <LoginAccountField value={value} onChange={setValue} label="邮箱" {...props} />
  );
}

const registerMode = {
  disableAtDetection: true,
  allowedDomains: ["@njupt.edu.cn", "@sast.fun"] as const,
};

describe("LoginAccountField register mode (disableAtDetection)", () => {
  it("splits a typed full whitelisted address into prefix + capsule", async () => {
    render(<StatefulField {...registerMode} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "xx@njupt.edu.cn");

    expect(screen.getByLabelText("邮箱")).toHaveValue("xx");
    expect(screen.getByRole("button", { name: "选择邮箱域名" })).toHaveTextContent(
      "@njupt.edu.cn",
    );
  });

  it("switches the capsule when a full @sast.fun address is typed", async () => {
    render(<StatefulField {...registerMode} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "yy@sast.fun");

    expect(screen.getByLabelText("邮箱")).toHaveValue("yy");
    expect(screen.getByRole("button", { name: "选择邮箱域名" })).toHaveTextContent(
      "@sast.fun",
    );
  });

  it("keeps a foreign full address in the prefix so the error stays visible", async () => {
    render(<StatefulField {...registerMode} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "xx@gmail.com");

    expect(screen.getByLabelText("邮箱")).toHaveValue("xx@gmail.com");
    expect(screen.getByRole("button", { name: "选择邮箱域名" })).toHaveTextContent(
      "@njupt.edu.cn",
    );
  });

  it("previews the code target with the register hint copy", async () => {
    render(<StatefulField {...registerMode} context="register" />);
    await userEvent.type(screen.getByLabelText("邮箱"), "B23000000@SAST.FUN");

    expect(
      await screen.findByText("将发送验证码到 b23000000@sast.fun"),
    ).toBeInTheDocument();
  });
});

describe("LoginAccountField login mode", () => {
  it("flips to the other-email mode once an @ is typed", async () => {
    render(<StatefulField />);
    await userEvent.type(screen.getByLabelText("邮箱"), "a@b.com");

    expect(screen.getByLabelText("邮箱")).toHaveValue("a@b.com");
    expect(screen.queryByRole("button", { name: "选择邮箱域名" })).not.toBeInTheDocument();
  });

  it("previews the resolved address with the login hint copy", async () => {
    render(<StatefulField />);
    await userEvent.type(screen.getByLabelText("邮箱"), "B21");

    expect(await screen.findByText("将使用 b21@njupt.edu.cn 继续")).toBeInTheDocument();
  });
});

describe("LoginAccountField a11y and locking", () => {
  it("associates the visible label with the input", () => {
    render(<StatefulField />);
    const label = screen.getByText("邮箱");
    const input = screen.getByLabelText("邮箱");
    expect(label.getAttribute("for")).toBe(input.getAttribute("id"));
  });

  it("disables both the input and the domain capsule when disabled", () => {
    render(<StatefulField {...registerMode} disabled />);
    expect(screen.getByLabelText("邮箱")).toBeDisabled();
    expect(screen.getByRole("button", { name: "选择邮箱域名" })).toBeDisabled();
  });
});
