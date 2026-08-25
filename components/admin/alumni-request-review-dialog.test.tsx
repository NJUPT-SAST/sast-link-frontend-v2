import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AlumniRequest } from "@/lib/api/types";
import { AlumniRequestReviewDialog } from "./alumni-request-review-dialog";

const request: AlumniRequest = {
  id: 7,
  name: "张三",
  student_id: "B18040101",
  login_email: "b18040101@njupt.edu.cn",
  personal_email: "zhangsan@qq.com",
  phone_number: "13800000001",
  qq_number: "100001",
  college: "其他",
  major: "软件工程",
  join_year: "2018",
  department_note: "软件研发部",
  note: "",
  status: "pending",
  reject_reason: "",
  created_user_id: null,
  reviewed_by: null,
  reviewed_at: null,
  notified_at: null,
  notify_attempts: 0,
  created_at: "2026-02-01T02:00:00Z",
  updated_at: "2026-02-01T02:00:00Z",
};

function setup(overrides: {
  onApprove?: jest.Mock;
  onReject?: jest.Mock;
  onOpenChange?: jest.Mock;
} = {}) {
  const onApprove =
    overrides.onApprove ??
    jest.fn().mockResolvedValue({
      user_id: 9007,
      login_email: request.login_email,
      notify_enqueued: true,
    });
  const onReject = overrides.onReject ?? jest.fn().mockResolvedValue(undefined);
  const onOpenChange = overrides.onOpenChange ?? jest.fn();
  render(
    <AlumniRequestReviewDialog
      request={request}
      open
      onOpenChange={onOpenChange}
      onApprove={onApprove}
      onReject={onReject}
    />,
  );
  return { onApprove, onReject, onOpenChange };
}

/** axios-shaped rejection so toApiError() can read the business code. */
function apiFailure(status: number, code: number, message: string) {
  return {
    isAxiosError: true,
    response: { status, data: { code, message, data: null }, headers: {} },
    message,
  };
}

describe("AlumniRequestReviewDialog", () => {
  it("shows both mailboxes with their distinct roles", () => {
    setup();
    expect(screen.getByText("学号邮箱（账号标识）")).toBeInTheDocument();
    expect(screen.getByText("常用邮箱（登录身份）")).toBeInTheDocument();
    expect(screen.getByText("zhangsan@qq.com")).toBeInTheDocument();
  });

  // Approval takes no editable fields: the backend provisions from the stored
  // request, which is what removes the transcription step entirely.
  it("approves with only the request id", async () => {
    const { onApprove } = setup();
    await userEvent.click(screen.getByRole("button", { name: "通过并建号" }));

    await waitFor(() => expect(onApprove).toHaveBeenCalledWith(7));
    expect(await screen.findByText("已通过")).toBeInTheDocument();
    expect(screen.getByText(/通知邮件已进入发送队列/)).toBeInTheDocument();
  });

  // The account exists either way, so a failed notification must be surfaced —
  // otherwise the applicant is never told and silently waits forever.
  it("warns the reviewer when the notification could not be queued", async () => {
    const onApprove = jest.fn().mockResolvedValue({
      user_id: 9007,
      login_email: request.login_email,
      notify_enqueued: false,
    });
    setup({ onApprove });
    await userEvent.click(screen.getByRole("button", { name: "通过并建号" }));

    expect(await screen.findByText("通知邮件未能入队。")).toBeInTheDocument();
    expect(screen.getByText(/zhangsan@qq.com/)).toBeInTheDocument();
  });

  it("requires a reason before rejecting", async () => {
    const { onReject } = setup();
    await userEvent.click(screen.getByRole("button", { name: "驳回" }));
    await userEvent.click(screen.getByRole("button", { name: "确认驳回" }));

    expect(await screen.findByText("请填写驳回理由")).toBeInTheDocument();
    expect(onReject).not.toHaveBeenCalled();
  });

  it("rejects with the typed reason", async () => {
    const { onReject } = setup();
    await userEvent.click(screen.getByRole("button", { name: "驳回" }));
    await userEvent.type(screen.getByLabelText(/驳回理由/), "档案中未找到该学号");
    await userEvent.click(screen.getByRole("button", { name: "确认驳回" }));

    await waitFor(() =>
      expect(onReject).toHaveBeenCalledWith(7, "档案中未找到该学号"),
    );
  });

  // 42204 means a colleague ruled on this ticket first (or the button was double
  // clicked). Retrying cannot succeed, so the dialog closes and the list refreshes
  // rather than showing an error the reviewer can act on.
  it("closes when the ticket was already reviewed by someone else", async () => {
    const onApprove = jest
      .fn()
      .mockRejectedValue(apiFailure(422, 42204, "申请已被处理"));
    const { onOpenChange } = setup({ onApprove });
    await userEvent.click(screen.getByRole("button", { name: "通过并建号" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(screen.queryByText("已通过")).not.toBeInTheDocument();
  });

  it("closes when a reject races another verdict", async () => {
    const onReject = jest
      .fn()
      .mockRejectedValue(apiFailure(422, 42204, "申请已被处理"));
    const { onOpenChange } = setup({ onReject });
    await userEvent.click(screen.getByRole("button", { name: "驳回" }));
    await userEvent.type(screen.getByLabelText(/驳回理由/), "重复申请");
    await userEvent.click(screen.getByRole("button", { name: "确认驳回" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("surfaces an approval failure instead of claiming success", async () => {
    const onApprove = jest.fn().mockRejectedValue(new Error("boom"));
    setup({ onApprove });
    await userEvent.click(screen.getByRole("button", { name: "通过并建号" }));

    await waitFor(() => expect(onApprove).toHaveBeenCalled());
    expect(screen.queryByText("已通过")).not.toBeInTheDocument();
  });
});
