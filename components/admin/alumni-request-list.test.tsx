import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AlumniRequest } from "@/lib/api/types";
import { AlumniRequestList } from "./alumni-request-list";

function makeRequest(overrides: Partial<AlumniRequest> = {}): AlumniRequest {
  return {
    id: 1,
    name: "张三",
    student_id: "B18040101",
    login_email: "b18040101@njupt.edu.cn",
    personal_email: "zhangsan@qq.com",
    phone_number: "13800000001",
    qq_number: "100001",
    college: "其他",
    major: "软件工程",
    join_year: "2018",
    department_note: "",
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
    ...overrides,
  };
}

describe("AlumniRequestList", () => {
  it("renders an empty state", () => {
    render(<AlumniRequestList requests={[]} />);
    expect(screen.getByText("没有符合条件的申请")).toBeInTheDocument();
  });

  it("offers review only for pending requests", async () => {
    const onReview = jest.fn();
    render(
      <AlumniRequestList
        requests={[
          makeRequest({ id: 1, status: "pending" }),
          makeRequest({ id: 2, status: "approved", created_user_id: 42 }),
        ]}
        onReview={onReview}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: "审核" });
    expect(buttons).toHaveLength(1);
    await userEvent.click(buttons[0]);
    expect(onReview).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  // A lecturer may list requests but not act on them (backend gates approve and
  // reject on the admin role), so the affordance is withheld rather than failing.
  it("hides the review button when no handler is supplied", () => {
    render(<AlumniRequestList requests={[makeRequest()]} />);
    expect(screen.queryByRole("button", { name: "审核" })).not.toBeInTheDocument();
  });

  it("shows the reject reason for a rejected request", () => {
    render(
      <AlumniRequestList
        requests={[
          makeRequest({ status: "rejected", reject_reason: "档案中未找到该学号" }),
        ]}
      />,
    );
    expect(screen.getByText("档案中未找到该学号")).toBeInTheDocument();
  });

  // A reviewed ticket whose email never landed is the one state that needs a
  // human: the account is live and its owner was never told how to set a password.
  it("flags a reviewed request whose notification never landed", () => {
    render(
      <AlumniRequestList
        requests={[
          makeRequest({
            status: "approved",
            created_user_id: 43,
            notified_at: null,
            notify_attempts: 2,
          }),
        ]}
      />,
    );
    expect(screen.getByText("通知未送达")).toBeInTheDocument();
    expect(screen.getByText(/已尝试 2 次/)).toBeInTheDocument();
  });

  it("does not flag a pending request as undelivered", () => {
    render(<AlumniRequestList requests={[makeRequest({ status: "pending" })]} />);
    expect(screen.queryByText("通知未送达")).not.toBeInTheDocument();
  });

  it("offers resend only for reviewed requests with no delivery", async () => {
    const onResend = jest.fn();
    render(
      <AlumniRequestList
        requests={[
          makeRequest({ id: 1, status: "approved", notified_at: null, notify_attempts: 1 }),
          makeRequest({
            id: 2,
            status: "approved",
            notified_at: "2026-02-02T06:00:05Z",
            notify_attempts: 1,
          }),
          makeRequest({ id: 3, status: "pending" }),
        ]}
        onResend={onResend}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: "重发通知" });
    expect(buttons).toHaveLength(1);
    await userEvent.click(buttons[0]);
    expect(onResend).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("marks only the row being re-sent as busy", () => {
    render(
      <AlumniRequestList
        requests={[
          makeRequest({ id: 1, status: "approved", notified_at: null, notify_attempts: 1 }),
        ]}
        onResend={jest.fn()}
        resendingId={1}
      />,
    );
    expect(screen.getByRole("button", { name: "重发中…" })).toBeDisabled();
  });

  it("shows the provisioned account id for an approved request", () => {
    render(
      <AlumniRequestList
        requests={[makeRequest({ status: "approved", created_user_id: 9007 })]}
      />,
    );
    expect(screen.getByText("9007")).toBeInTheDocument();
  });
});
