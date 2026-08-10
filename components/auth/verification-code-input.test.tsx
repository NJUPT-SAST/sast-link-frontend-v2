import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { message } from "@/lib/message";
import { VerificationCodeInput } from "./verification-code-input";

jest.mock("@/lib/message", () => ({
  message: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
  },
}));

describe("VerificationCodeInput", () => {
  beforeEach(() => {
    (message.error as jest.Mock).mockClear();
  });
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("counts down before allowing resend", () => {
    render(<VerificationCodeInput onResend={jest.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByText("60s 后重新发送")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(61_000);
    });

    expect(screen.getByText("重新发送")).toBeInTheDocument();
    expect(screen.getByText("重新发送")).toHaveClass("cursor-pointer");
  });

  it("calls onResend and resets the countdown after clicking resend", async () => {
    const onResend = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<VerificationCodeInput onResend={onResend} />);

    act(() => {
      jest.advanceTimersByTime(61_000);
    });

    await user.click(screen.getByText("重新发送"));

    await waitFor(() => {
      expect(onResend).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("60s 后重新发送")).toBeInTheDocument();
  });

  it("shows an error and re-enables resend when the request fails", async () => {
    const onResend = jest.fn().mockRejectedValue(new Error("boom"));
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<VerificationCodeInput onResend={onResend} />);

    act(() => {
      jest.advanceTimersByTime(61_000);
    });

    await user.click(screen.getByText("重新发送"));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith("验证码发送失败，请重试");
    });
    const resend = await screen.findByRole("button", { name: "重新发送" });
    expect(resend).toBeEnabled();
  });

  it("uses semantic foreground colors for disabled and enabled states", () => {
    const { rerender } = render(
      <VerificationCodeInput onResend={jest.fn().mockResolvedValue(undefined)} />,
    );

    expect(screen.getByText("60s 后重新发送")).toBeDisabled();
    expect(screen.getByText("60s 后重新发送")).toHaveClass(
      "text-muted-foreground",
    );

    act(() => {
      jest.advanceTimersByTime(61_000);
    });

    rerender(<VerificationCodeInput onResend={jest.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByText("重新发送")).toHaveClass(
      "cursor-pointer",
      "text-primary",
    );
  });
});
