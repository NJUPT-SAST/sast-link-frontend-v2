"use client";

import { useCallback, useState } from "react";
import { useSWRConfig } from "swr";

import type {
  AdminUserListParams,
  AdminUpdateUserRequest,
  Department,
  UserProfileData,
  UserRole,
  UserState,
} from "@/lib/api/types";
import { updateAdminUser } from "@/lib/api/admin";
import { message } from "@/lib/message";
import { useAdminUsers, buildAdminUsersKey } from "@/hooks/use-admin-users";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
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

export default function AdminUsersPage() {
  const { mutate } = useSWRConfig();
  const role = useUserProfileStore((state) => state.profile.role);
  const canManage = canManageUsers(role);
  const [filters, setFilters] = useState<AdminUserListParams>({ page: 1, page_size: 20 });
  const { data, isLoading, error } = useAdminUsers(filters);
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
    setBatchOpen(false);
    setBatchLoading(true);
    try {
      const request: AdminUpdateUserRequest = {
        ...(fields.role ? { role: fields.role as UserRole } : {}),
        ...(fields.state ? { state: fields.state as UserState } : {}),
        ...(fields.department ? { department: fields.department as Department } : {}),
      };
      const ids = Array.from(selectedIds);
      let successCount = 0;
      const failedIds: number[] = [];
      for (const id of ids) {
        try {
          await updateAdminUser(id, request);
          successCount++;
        } catch {
          failedIds.push(id);
        }
      }
      if (failedIds.length > 0) {
        // Keep only the failed ids selected so the admin can retry them.
        message.error(`成功 ${successCount} 个，失败 ${failedIds.length} 个，已保留失败项`);
        setSelectedIds(new Set(failedIds));
      } else {
        message.success(`已批量修改 ${successCount} 个用户`);
        setSelectedIds(new Set());
      }
      await mutate(buildAdminUsersKey(filters));
    } catch {
      setSelectedIds(new Set());
    } finally {
      setBatchLoading(false);
    }
  };

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleFiltersChange = useCallback((next: AdminUserListParams) => {
    setFilters(next);
  }, []);

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
      <div className="flex items-center justify-between">
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
