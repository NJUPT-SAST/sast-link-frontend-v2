import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RegisterEmailForm from "./register-email-form";

jest.mock(
  "next/link",
  () =>
    function Link({ children }: { children: React.ReactNode }) {
      return <>{children}</>;
    },
);

describe("RegisterEmailForm", () => {
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
});
