"use client";

import type { AlumniRequest } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ALUMNI_REQUEST_STATUS_LABELS, formatAdminDate } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";

interface AlumniRequestListProps {
  requests: AlumniRequest[];
  loading?: boolean;
  /** Review affordance, supplied by the page when the viewer may act; the
   *  backend gates approve/reject on the admin role. */
  onReview?: (request: AlumniRequest) => void;
  /** Kept in lockstep with onReview: only an acting viewer gets a resend. */
  onResend?: (request: AlumniRequest) => void;
  /** Id currently being re-sent, so only that row shows a busy button. */
  resendingId?: number | null;
}

const STATUS_CLASS: Record<string, string> = {
  pending: "text-foreground",
  approved: "text-muted-foreground",
  rejected: "text-destructive",
};

function StatusBadge({ status }: { status: AlumniRequest["status"] }) {
  return (
    <span className={cn("type-tech text-xs", STATUS_CLASS[status])}>
      {ALUMNI_REQUEST_STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** A recover-intent ticket is a high-risk approval: granting it binds a
 *  receivable mailbox onto a live account's login identities instead of
 *  creating a fresh one, so the card must say so at a glance. */
function RecoverBadge() {
  return (
    <span className="type-tech rounded-sm border border-destructive/50 px-1.5 py-0.5 text-xs text-destructive">
      恢复访问
    </span>
  );
}

/** A reviewed ticket whose result email never landed.
 *
 *  The email is the alumnus's only instruction to go set a password, so an
 *  undelivered one means the provisioning was wasted work — the account exists and
 *  its owner does not know. `notify_attempts > 0` with no `notified_at` is a
 *  delivery that was tried and failed; zero attempts means it never left the
 *  queue. Both need a human, so both surface. */
function isNotifyPending(request: AlumniRequest): boolean {
  return request.status !== "pending" && request.notified_at === null;
}

/** One request per card rather than a wide table: a request carries nine display
 *  fields, and squeezing them into columns produces a horizontal scroll on every
 *  viewport. Cards read the same at 375px and 1440px, so no reflow ordering is
 *  needed here — unlike the user/client tables that genuinely are tabular. */
export function AlumniRequestList({
  requests,
  loading = false,
  onReview,
  onResend,
  resendingId = null,
}: AlumniRequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center border-t border-hairline text-sm text-tertiary">
        没有符合条件的申请
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 border-t border-hairline pt-3">
      {requests.map((request) => (
        <li
          key={request.id}
          className={cn(
            "flex flex-col gap-3 border bg-card p-4",
            request.intent === "recover" ? "border-destructive/50" : "border-hairline",
          )}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="type-headline">{request.name}</span>
            <span className="type-tech text-xs text-tertiary">{request.student_id}</span>
            <StatusBadge status={request.status} />
            {request.intent === "recover" && <RecoverBadge />}
            {isNotifyPending(request) && (
              <span className="type-tech text-xs text-destructive">通知未送达</span>
            )}
            <span className="ml-auto type-tech text-xs text-tertiary">
              #{request.id} · {formatAdminDate(request.created_at)}
            </span>
          </div>

          {request.intent === "recover" && request.status === "pending" && (
            <p className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
              高危操作：批准后，申请中的常用邮箱将直接绑定为该学号账号的登录身份，
              可凭其登录与重置密码。请核对账号资料后谨慎审批。
            </p>
          )}

          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="shrink-0 text-tertiary">常用邮箱</dt>
              <dd className="min-w-0 break-all">{request.personal_email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-tertiary">学号邮箱</dt>
              <dd className="min-w-0 break-all text-muted-foreground">
                {request.login_email}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-tertiary">学院专业</dt>
              <dd className="min-w-0">
                {request.college} · {request.major}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-tertiary">入会年份</dt>
              <dd>
                {request.join_year}
                {request.department_note ? ` · ${request.department_note}` : ""}
              </dd>
            </div>
          </dl>

          {request.status === "rejected" && request.reject_reason && (
            <p className="text-sm text-muted-foreground">
              <span className="text-tertiary">驳回理由：</span>
              {request.reject_reason}
            </p>
          )}
          {request.status === "approved" && request.created_user_id && (
            <p className="text-sm text-muted-foreground">
              <span className="text-tertiary">已开通账号 ID：</span>
              {request.created_user_id}
            </p>
          )}
          {isNotifyPending(request) && (
            <p className="text-sm text-muted-foreground">
              <span className="text-tertiary">通知状态：</span>
              {request.notify_attempts > 0
                ? `已尝试 ${request.notify_attempts} 次，均未确认送达`
                : "尚未发送"}
              。申请人可能未收到设置密码的指引，请重发或手动联系。
            </p>
          )}

          {(onReview || onResend) && (
            <div className="flex flex-wrap justify-end gap-2">
              {onResend && isNotifyPending(request) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || resendingId === request.id}
                  onClick={() => onResend(request)}
                >
                  {resendingId === request.id ? "重发中…" : "重发通知"}
                </Button>
              )}
              {onReview && request.status === "pending" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => onReview(request)}
                >
                  审核
                </Button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
