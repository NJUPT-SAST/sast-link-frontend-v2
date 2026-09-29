import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { registerSendCode } from "@/lib/api/auth";
import RegisterEmailForm from "./register-email-form";

jest.mock("@/lib/api/auth", () => ({
  registerSendCode: jest.fn().mockResolvedValue({ data: { data: {} } }),
  registerVerifyCode: jest.fn(),
}));

jest.mock(
  "next/link",
  () =>
    function Link({ children }: { children: React.ReactNode }) {
      return <>{children}</>;
    },
);

// Default to a solvable challenge so the pre-existing cases see the form as-is;
// the alumni-entry block below overrides it per case.
jest.mock("@/hooks/use-turnstile", () => ({
  useTurnstileScript: jest.fn(() => "ready"),
}));

const mockSendCode = registerSendCode as jest.MockedFunction<typeof registerSendCode>;

describe("RegisterEmailForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefills the domain capsule from an @sast.fun default email", () => {
    render(<RegisterEmailForm defaultEmail="alice@sast.fun" onVerified={jest.fn()} />);
    expect(screen.getByRole("button", { name: "选择邮箱域名" })).toHaveTextContent(
      "@sast.fun",
    );
  });

  it("sends the code when Enter is pressed in the email field before sending", async () => {
    render(<RegisterEmailForm onVerified={jest.fn()} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "b23000001{enter}");
    // Sending starts the resend countdown, replacing the "获取验证码" button.
    expect(await screen.findByText("60s 后重新发送")).toBeInTheDocument();
  });

  it("posts the typed address on the first send, not a bare domain", async () => {
    render(<RegisterEmailForm onVerified={jest.fn()} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "b23000000");
    await userEvent.click(screen.getByRole("button", { name: "获取验证码" }));

    expect(mockSendCode).toHaveBeenCalledTimes(1);
    expect(mockSendCode).toHaveBeenCalledWith("b23000000@njupt.edu.cn");
  });

  it("splits a typed full whitelisted address instead of failing on the @", async () => {
    render(<RegisterEmailForm onVerified={jest.fn()} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "b23000002@njupt.edu.cn");

    expect(screen.getByLabelText("邮箱")).toHaveValue("b23000002");
    await userEvent.click(screen.getByRole("button", { name: "获取验证码" }));
    expect(mockSendCode).toHaveBeenCalledWith("b23000002@njupt.edu.cn");
  });

  // RHF's trigger() drops object-field errors without a top-level message, so
  // an invalid account used to fail the send with no feedback at all.
  it("surfaces the localPart error when a foreign full address is submitted", async () => {
    render(<RegisterEmailForm onVerified={jest.fn()} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "xx@gmail.com");
    await userEvent.click(screen.getByRole("button", { name: "获取验证码" }));

    expect(mockSendCode).not.toHaveBeenCalled();
    expect(await screen.findByText("邮箱前缀不能包含 @")).toBeInTheDocument();
  });

  it("clears a stale account error once the address is fixed and sent", async () => {
    render(<RegisterEmailForm onVerified={jest.fn()} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "xx@gmail.com");
    await userEvent.click(screen.getByRole("button", { name: "获取验证码" }));
    expect(await screen.findByText("邮箱前缀不能包含 @")).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("邮箱"));
    await userEvent.type(screen.getByLabelText("邮箱"), "b23000000");
    await userEvent.click(screen.getByRole("button", { name: "获取验证码" }));

    expect(mockSendCode).toHaveBeenCalledWith("b23000000@njupt.edu.cn");
    expect(await screen.findByText("60s 后重新发送")).toBeInTheDocument();
    expect(screen.queryByText("邮箱前缀不能包含 @")).not.toBeInTheDocument();
  });

  it("locks the address once the code is on its way", async () => {
    render(<RegisterEmailForm onVerified={jest.fn()} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "b23000000");
    await userEvent.click(screen.getByRole("button", { name: "获取验证码" }));
    expect(await screen.findByText("60s 后重新发送")).toBeInTheDocument();

    expect(screen.getByLabelText("邮箱")).toBeDisabled();
    expect(screen.getByRole("button", { name: "选择邮箱域名" })).toBeDisabled();
  });

  it("ignores a foreign default email instead of prefilling an error state", () => {
    render(<RegisterEmailForm defaultEmail="foo@gmail.com" onVerified={jest.fn()} />);
    expect(screen.getByLabelText("邮箱")).toHaveValue("");
  });

  it("previews where the code goes instead of the login copy", async () => {
    render(<RegisterEmailForm onVerified={jest.fn()} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "b23000000");
    expect(
      await screen.findByText("将发送验证码到 b23000000@njupt.edu.cn"),
    ).toBeInTheDocument();
  });

  // The NJUPT mailbox prefix is the student ID (backend PR #101); rejecting
  // client-side keeps the request from ever leaving.
  it("rejects a non-student-id njupt prefix before sending", async () => {
    render(<RegisterEmailForm onVerified={jest.fn()} />);
    await userEvent.type(screen.getByLabelText("邮箱"), "my-nickname");
    await userEvent.click(screen.getByRole("button", { name: "获取验证码" }));

    expect(mockSendCode).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        "@njupt.edu.cn 前缀须为学号样式：1 位字母 + 8 位数字或纯 8 位数字",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the sast.fun prefix free-form", async () => {
    render(<RegisterEmailForm onVerified={jest.fn()} />);
    // Typing the full address also flips the capsule to @sast.fun.
    await userEvent.type(screen.getByLabelText("邮箱"), "any-nick@sast.fun");
    await userEvent.click(screen.getByRole("button", { name: "获取验证码" }));

    expect(mockSendCode).toHaveBeenCalledWith("any-nick@sast.fun");
  });
});

// The alumni fallback is only reachable when a Turnstile challenge can actually
// be solved: the backend verifies the token unconditionally, so linking to a form
// that cannot succeed would strand the applicant on a dead page.
describe("RegisterEmailForm alumni entry", () => {
  const useTurnstileScript = jest.requireMock("@/hooks/use-turnstile")
    .useTurnstileScript as jest.Mock;

  it.each(["ready", "loading"] as const)(
    "shows the alumni entry when the captcha is %s",
    (state) => {
      useTurnstileScript.mockReturnValue(state);
      render(<RegisterEmailForm onVerified={jest.fn()} />);
      expect(screen.getByText(/申请建号/)).toBeInTheDocument();
    },
  );

  it.each(["disabled", "unavailable"] as const)(
    "hides the alumni entry when the captcha is %s",
    (state) => {
      useTurnstileScript.mockReturnValue(state);
      render(<RegisterEmailForm onVerified={jest.fn()} />);
      expect(screen.queryByText(/申请建号/)).not.toBeInTheDocument();
    },
  );
});
