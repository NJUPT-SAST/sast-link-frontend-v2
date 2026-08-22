"use client";

import { Suspense, useCallback, useState } from "react";
import { useSWRConfig } from "swr";

import type {
  AdminBatchRoleUpdateResult,
  AdminUpdateUserRequest,
  AdminUserListParams,
  Department,
  UserProfileData,
  UserRole,
  UserState,
} from "@/lib/api/types";
import {
  computeRoleFailedIds,
  summarizeBatchEdit,
  updateAdminUser,
  updateAdminUsersRole,
} from "@/lib/api/admin";
import { toApiError } from "@/lib/api/errors";
import { message } from "@/lib/message";
import { useAdminUsers, buildAdminUsersKey } from "@/hooks/use-admin-users";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { useAdminUserListParams } from "@/hooks/use-admin-list-params";
import {
  PAGE_SIZE_OPTIONS,
  serializeAdminUserListParams,
} from "@/lib/admin/list-query";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { canManageUsers } from "@/components/admin/permissions";
import { UserFilters } from "@/components/admin/user-filters";
import { UserList } from "@/components/admin/user-list";
import { Pagination } from "@/components/admin/pagination";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminErrorState } from "@/components/admin/error-state";
import {
  UserBatchEditDialog,
  type BatchEditFields,
} from "@/components/admin/user-batch-edit-dialog";
import { DotLoading } from "@/components/ui/dot-loading";
import { Button } from "@/components/ui/button";

function AdminUsersContent() {
  const { mutate } = useSWRConfig();
  const role = useUserProfileStore((state) => state.profile.role);
  const canManage = canManageUsers(role);
  // Filters live in the URL so "查看/编辑 → 返回" lands back on the same page of
  // the same filtered list instead of resetting to page 1.
  const [filters, setFilters] = useAdminUserListParams();
  const { data, isLoading, error } = useAdminUsers(filters);
  const listQuery = serializeAdminUserListParams(filters);
  const { deleteUser, restoreUser, isLoading: mutationLoading } = useAdminMutations();

  const [confirm, setConfirm] = useState<{
    open: boolean;
    user: UserProfileData | null;
    action: "delete" | "restore";
  }>({ open: false, user: null, action: "delete" });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          data?.users.forEach((u) => next.add(u.id));
        } else {
          data?.users.forEach((u) => next.delete(u.id));
        }
        return next;
      });
    },
    [data],
  );

  const handleBatchConfirm = async (fields: BatchEditFields) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || (!fields.role && !fields.state && !fields.department)) {
      setBatchOpen(false);
      return;
    }
    setBatchOpen(false);
    setBatchLoading(true);
    try {
      // Phase 1 — role changes go through the batch endpoint (one request).
      let roleResults: AdminBatchRoleUpdateResult[] | null = null;
      if (fields.role) {
        try {
          const res = await updateAdminUsersRole({ ids, role: fields.role as UserRole });
          roleResults = res.data.data.results;
        } catch (error) {
          // Request-level failure: no per-item results. Treat every id as failed
          // with the surfaced reason and skip the per-user phase, since claiming
          // any user "modified" would misrepresent the role outcome.
          const reason = toApiError(error).message;
          roleResults = ids.map((id) => ({ id, success: false, reason }));
        }
      }

      // Phase 2 — state/department stay one-by-one. Skip ids whose role change
      // already failed (or was not reported).
      const singleUpdateFailures = new Map<number, string>();
      if (fields.state || fields.department) {
        const roleFailed = computeRoleFailedIds(ids, roleResults);
        const request: AdminUpdateUserRequest = {
          ...(fields.state ? { state: fields.state as UserState } : {}),
          ...(fields.department ? { department: fields.department as Department } : {}),
        };
        for (const id of ids) {
          if (roleFailed.has(id)) continue;
          try {
            await updateAdminUser(id, request);
          } catch (error) {
            singleUpdateFailures.set(id, toApiError(error).message);
          }
        }
      }

      const { successCount, failedIds, reasons } = summarizeBatchEdit({
        ids,
        roleResults,
        singleUpdateFailures,
      });

      if (failedIds.length > 0) {
        // Keep only the failed ids selected so the admin can retry them.
        const detail = reasons
          .slice(0, 3)
          .map((r) => `「${r}」`)
          .join("；");
        message.error(
          `成功 ${successCount} 个，失败 ${failedIds.length} 个，已保留失败项${detail ? `（${detail}）` : ""}`,
          detail ? 5000 : undefined,
        );
        setSelectedIds(new Set(failedIds));
      } else {
        message.success(`已批量修改 ${successCount} 个用户`);
        setSelectedIds(new Set());
      }
      await mutate(buildAdminUsersKey(filters));
    } catch {
      // Truly unexpected (setup / mutate): keep existing behavior.
      setSelectedIds(new Set());
    } finally {
      setBatchLoading(false);
    }
  };

  const handlePageChange = useCallback(
    (page: number) => {
      // Selection is per-page on purpose: the checkboxes and 全选本页 only ever
      // reflect the rows currently on screen, so carrying ids across a page turn
      // would let a batch edit hit users the admin can no longer see.
      setSelectedIds(new Set());
      setFilters({ ...filters, page });
    },
    [filters, setFilters],
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      setSelectedIds(new Set());
      setFilters({ ...filters, page: 1, page_size: pageSize });
    },
    [filters, setFilters],
  );

  const handleFiltersChange = useCallback(
    (next: AdminUserListParams) => {
      // A new filter set replaces the visible rows entirely — same reasoning.
      setSelectedIds(new Set());
      setFilters(next);
    },
    [setFilters],
  );

  const handleRestore = (user: UserProfileData) => {
    setConfirm({ open: true, user, action: "restore" });
  };

  const handleConfirm = async () => {
    if (!confirm.user) return;
    if (confirm.action === "delete") {
      await deleteUser(confirm.user.id, filters);
    } else {
      await restoreUser(confirm.user.id, filters);
    }
    setConfirm({ open: false, user: null, action: "delete" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-title2">用户管理</h1>
        </div>
        {canManage && selectedIds.size > 0 && (
          <Button onClick={() => setBatchOpen(true)} disabled={batchLoading}>
            批量修改（{selectedIds.size}）
          </Button>
        )}
      </div>

      <UserFilters value={filters} onChange={handleFiltersChange} />

      {canManage && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 text-sm text-tertiary">
          <span>已选 {selectedIds.size} 人</span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            清除选择
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      )}

      {error && <AdminErrorState onRetry={() => mutate(buildAdminUsersKey(filters))} />}

      {!isLoading && !error && data && (
        <>
          <UserList
            users={data.users}
            loading={mutationLoading}
            canManage={canManage}
            listQuery={listQuery}
            onRestore={handleRestore}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
          />
          <Pagination
            page={data.page}
            pageSize={data.page_size}
            total={data.total}
            onChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </>
      )}

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm((prev) => ({ ...prev, open }))}
        title={confirm.action === "delete" ? "确认注销用户" : "确认恢复用户"}
        description={
          confirm.user
            ? confirm.action === "delete"
              ? `确定要注销用户「${confirm.user.name}」吗？注销后该用户将无法登录，但数据会被保留。`
              : `确定要恢复用户「${confirm.user.name}」吗？恢复后状态将变为「在校学生」。`
            : ""
        }
        confirmLabel={confirm.action === "delete" ? "注销" : "恢复"}
        confirmVariant={confirm.action === "delete" ? "destructive" : "default"}
        loading={mutationLoading}
        onConfirm={handleConfirm}
      />

      <UserBatchEditDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        count={selectedIds.size}
        loading={batchLoading}
        onConfirm={handleBatchConfirm}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  // useSearchParams (inside useAdminUserListParams) suspends on a page load.
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
