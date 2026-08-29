import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AlumniRequest } from "@/lib/api/types";
import { AlumniRequestReviewDialog } from "./alumni-request-review-dialog";

const defaultRequest: AlumniRequest = {
  id: 7,
  name: "张三",
  student_id: "B18040101",
  login_email: "b18040101@njupt.edu.cn",
  personal_email: "zhangsan@qq.com",
  intent: "provision",
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

function recoverRequest(): AlumniRequest {
  return { ...defaultRequest, intent: "recover" };
}

function setup(overrides: {
  request?: AlumniRequest;
  onApprove?: jest.Mock;
  onReject?: jest.Mock;
  onOpenChange?: jest.Mock;
} = {}) {
  const request = overrides.request ?? defaultRequest;
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
  return { request, onApprove, onReject, onOpenChange };
}

/** axios-shaped rejection so toApiError() can read the business code. */
function apiFailure(status: number, code: number, message: string) {
  return {
    isAxiosError: true,
    response: { status, data: { code, message, data: null }, headers: {} },
    message,
  };
}

/** Approval is two steps now: the first click opens a confirm step, only the
 *  second one actually calls through. */
async function approveThroughConfirm(reviewButton: string, confirmButton: string) {
  await userEvent.click(screen.getByRole("button", { name: reviewButton }));
  await userEvent.click(screen.getByRole("button", { name: confirmButton }));
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
    await approveThroughConfirm("通过并建号", "确认通过");

    await waitFor(() => expect(onApprove).toHaveBeenCalledWith(7));
    expect(await screen.findByText("已通过")).toBeInTheDocument();
    expect(screen.getByText(/通知邮件已进入发送队列/)).toBeInTheDocument();
  });

  // The account exists either way, so a failed notification must be surfaced —
  // otherwise the applicant is never told and silently waits forever.
  it("warns the reviewer when the notification could not be queued", async () => {
    const onApprove = jest.fn().mockResolvedValue({
      user_id: 9007,
      login_email: defaultRequest.login_email,
      notify_enqueued: false,
    });
    setup({ onApprove });
    await approveThroughConfirm("通过并建号", "确认通过");

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
    await approveThroughConfirm("通过并建号", "确认通过");

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
    await approveThroughConfirm("通过并建号", "确认通过");

    await waitFor(() => expect(onApprove).toHaveBeenCalled());
    expect(screen.queryByText("已通过")).not.toBeInTheDocument();
  });

  describe("recover tickets", () => {
    it("flags the high-risk wording and does not approve on the first click", async () => {
      const { onApprove } = setup({ request: recoverRequest() });

      expect(screen.getByText("审核恢复访问申请")).toBeInTheDocument();
      expect(screen.getByText(/高危操作/)).toBeInTheDocument();

      // The review button only opens the confirm step; nothing is called yet.
      await userEvent.click(screen.getByRole("button", { name: "通过并绑定邮箱" }));
      expect(onApprove).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "确认通过并绑定" })).toBeInTheDocument();
    });

    it("approves only after the explicit confirm", async () => {
      const { onApprove } = setup({ request: recoverRequest() });
      await approveThroughConfirm("通过并绑定邮箱", "确认通过并绑定");

      await waitFor(() => expect(onApprove).toHaveBeenCalledWith(7));
      expect(await screen.findByText("已通过")).toBeInTheDocument();
    });

    // 40900: the account for the student id vanished after the ticket was filed.
    // Nothing here can succeed on retry — close and let the refreshed queue
    // show the current state.
    it("closes and asks for a refresh when the target account is gone", async () => {
      const onApprove = jest
        .fn()
        .mockRejectedValue(apiFailure(409, 40900, "该学号当前没有对应账号，请刷新后核对工单"));
      const { onOpenChange } = setup({ request: recoverRequest(), onApprove });
      await approveThroughConfirm("通过并绑定邮箱", "确认通过并绑定");

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it("advises a rejection when the target account is deleted", async () => {
      const onApprove = jest
        .fn()
        .mockRejectedValue(apiFailure(422, 42200, "该学号的账号已注销，无法恢复访问方式"));
      setup({ request: recoverRequest(), onApprove });
      await approveThroughConfirm("通过并绑定邮箱", "确认通过并绑定");

      expect(await screen.findByText(/账号已注销，无法恢复访问方式，建议驳回/)).toBeInTheDocument();
    });

    it("advises a rejection when login_email drifted from the account", async () => {
      const onApprove = jest.fn().mockRejectedValue(
        apiFailure(
          422,
          42200,
          "工单中的 login_email 与该学号现有账号的登录邮箱不一致，请驳回后由申请人重新提交",
        ),
      );
      setup({ request: recoverRequest(), onApprove });
      await approveThroughConfirm("通过并绑定邮箱", "确认通过并绑定");

      expect(
        await screen.findByText(/请驳回后由申请人重新提交/),
      ).toBeInTheDocument();
    });

    it("advises a rejection when the account is at the bind cap", async () => {
      const onApprove = jest
        .fn()
        .mockRejectedValue(apiFailure(409, 40905, "该账号的邮箱绑定数量已达上限"));
      setup({ request: recoverRequest(), onApprove });
      await approveThroughConfirm("通过并绑定邮箱", "确认通过并绑定");

      expect(await screen.findByText(/绑定数量已达上限（2 个）/)).toBeInTheDocument();
    });
  });
});