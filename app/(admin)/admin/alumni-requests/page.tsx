"use client";

import { Suspense, useCallback, useState } from "react";
import { useSWRConfig } from "swr";

import type { AlumniRequest, AlumniRequestListParams } from "@/lib/api/types";
import { approveAlumniRequest, rejectAlumniRequest, resendAlumniRequestNotification } from "@/lib/api/alumni";
import { toApiError } from "@/lib/api/errors";
import { message } from "@/lib/message";
import { useAlumniRequests, buildAlumniRequestsKey } from "@/hooks/use-alumni-requests";
import { useAlumniRequestListParams } from "@/hooks/use-admin-list-params";
import { ALUMNI_REQUEST_STATUS_LABELS } from "@/lib/constants/admin";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/list-query";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { canManageUsers } from "@/components/admin/permissions";
import { AlumniRequestList } from "@/components/admin/alumni-request-list";
import { AlumniRequestReviewDialog } from "@/components/admin/alumni-request-review-dialog";
import { Pagination } from "@/components/admin/pagination";
import { AdminErrorState } from "@/components/admin/error-state";
import { DotLoading } from "@/components/ui/dot-loading";
import { Select } from "@/components/ui/select";

const controlClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-[15px] placeholder:text-tertiary focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  ...Object.entries(ALUMNI_REQUEST_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const NOTIFIED_OPTIONS = [
  { value: "", label: "全部" },
  { value: "true", label: "已送达" },
  { value: "false", label: "未送达" },
];

function AdminAlumniRequestsContent() {
  const { mutate } = useSWRConfig();
  const role = useUserProfileStore((state) => state.profile.role);
  // Listing is open to lecturers (backend RequireReader); approving/rejecting is
  // admin-only, so the review affordance is withheld rather than failing on click.
  const canReview = canManageUsers(role);
  const [filters, setFilters] = useAlumniRequestListParams();
  const { data, isLoading, error } = useAlumniRequests(filters);

  const [reviewing, setReviewing] = useState<AlumniRequest | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const refresh = useCallback(() => {
    void mutate(buildAlumniRequestsKey(filters));
  }, [mutate, filters]);

  const handleApprove = useCallback(
    async (id: number) => {
      const response = await approveAlumniRequest(id);
      refresh();
      return response.data.data;
    },
    [refresh],
  );

  const handleReject = useCallback(
    async (id: number, reason: string) => {
      const response = await rejectAlumniRequest(id, { reject_reason: reason });
      // Rejection mails the reason too, so the same queue caveat applies as on
      // approval: the verdict stands even when the notice did not get queued.
      message[response.data.data.notify_enqueued ? "success" : "warning"](
        response.data.data.notify_enqueued
          ? "已驳回，通知邮件已进入发送队列"
          : "已驳回，但通知邮件未能入队，请手动联系申请人",
      );
      refresh();
    },
    [refresh],
  );

  const handleResend = useCallback(
    async (request: AlumniRequest) => {
      setResendingId(request.id);
      try {
        const response = await resendAlumniRequestNotification(request.id);
        message[response.data.data.notify_enqueued ? "success" : "warning"](
          response.data.data.notify_enqueued
            ? "已重新入队，稍后可刷新查看送达状态"
            : "发送队列已满，请稍后重试",
        );
        refresh();
      } catch (error) {
        message.error(toApiError(error).message);
      } finally {
        setResendingId(null);
      }
    },
    [refresh],
  );

  const updateFilters = (next: AlumniRequestListParams) => setFilters(next);

  if (error) {
    return <AdminErrorState onRetry={refresh} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="type-title2">建号申请</h1>
        {data && (
          <span className="type-tech text-xs text-tertiary">共 {data.total} 条</span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <label htmlFor="status" className="mb-1.5 block text-xs text-muted-foreground">
            状态
          </label>
          <Select
            id="status"
            className={controlClass}
            value={filters.status ?? ""}
            onChange={(event) =>
              updateFilters({
                ...filters,
                page: 1,
                status: (event.target.value || undefined) as AlumniRequestListParams["status"],
              })
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <label htmlFor="keyword" className="mb-1.5 block text-xs text-muted-foreground">
            关键词
          </label>
          <input
            id="keyword"
            className={controlClass}
            placeholder="姓名 / 学号 / 邮箱"
            defaultValue={filters.keyword ?? ""}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              updateFilters({
                ...filters,
                page: 1,
                keyword: event.currentTarget.value.trim() || undefined,
              });
            }}
          />
        </div>
        <div className="sm:w-40">
          <label htmlFor="notified" className="mb-1.5 block text-xs text-muted-foreground">
            通知送达
          </label>
          <Select
            id="notified"
            className={controlClass}
            value={filters.notified === undefined ? "" : String(filters.notified)}
            onChange={(event) =>
              updateFilters({
                ...filters,
                page: 1,
                notified:
                  event.target.value === "" ? undefined : event.target.value === "true",
              })
            }
          >
            {NOTIFIED_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* The backend's `notified` predicate is purely `notified_at IS NULL` and
          does not imply a status, so 未送达 on its own also lists pending tickets —
          which have nothing to announce yet. The backlog that actually needs a
          human is status≠pending AND notified_at IS NULL (the condition behind
          idx_alumni_requests_pending_notification), and status is a single-value
          filter, so it cannot express "not pending". Point the reviewer at the
          combination instead of silently returning an inflated set. */}
      {filters.notified === false && filters.status === undefined && (
        <p className="text-xs leading-5 text-tertiary">
          “未送达”也包含尚未审核的申请（它们还没有结果可通知）。要只看真正需要补发的，
          请同时把状态选为“已通过”或“已驳回”；列表中带“通知未送达”标记的才是待处理项。
        </p>
      )}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      ) : (
        <>
          <AlumniRequestList
            requests={data?.requests ?? []}
            resendingId={resendingId}
            onReview={
              canReview
                ? (request) => {
                    setReviewing(request);
                    setReviewOpen(true);
                  }
                : undefined
            }
            onResend={canReview ? (request) => void handleResend(request) : undefined}
          />
          <Pagination
            page={data?.page ?? 1}
            pageSize={data?.page_size ?? DEFAULT_PAGE_SIZE}
            total={data?.total ?? 0}
            onChange={(page) => updateFilters({ ...filters, page })}
            onPageSizeChange={(pageSize) =>
              updateFilters({ ...filters, page: 1, page_size: pageSize })
            }
          />
        </>
      )}

      <AlumniRequestReviewDialog
        request={reviewing}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

export default function AdminAlumniRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      }
    >
      <AdminAlumniRequestsContent />
    </Suspense>
  );
}
