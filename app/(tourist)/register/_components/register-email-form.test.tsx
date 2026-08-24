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
    await userEvent.type(screen.getByLabelText("邮箱"), "carol{enter}");
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
