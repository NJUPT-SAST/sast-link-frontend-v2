"use client";

import { useState, useCallback } from "react";

import type { AdminUserListParams, UserProfileData } from "@/lib/api/types";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { UserFilters } from "@/components/admin/user-filters";
import { UserList } from "@/components/admin/user-list";
import { Pagination } from "@/components/admin/pagination";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DotLoading } from "@/components/ui/dot-loading";

export default function AdminUsersPage() {
  const [filters, setFilters] = useState<AdminUserListParams>({ page: 1, page_size: 20 });
  const { data, isLoading, error } = useAdminUsers(filters);
  const { deleteUser, restoreUser, isLoading: mutationLoading } = useAdminMutations();

  const [confirm, setConfirm] = useState<{
    open: boolean;
    user: UserProfileData | null;
    action: "delete" | "restore";
  }>({ open: false, user: null, action: "delete" });

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleFiltersChange = useCallback((next: AdminUserListParams) => {
    setFilters(next);
  }, []);

  const handleDelete = (user: UserProfileData) => {
    setConfirm({ open: true, user, action: "delete" });
  };

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
          <p className="mt-1 text-sm text-tertiary">查看、编辑和管理系统用户</p>
        </div>
      </div>

      <UserFilters value={filters} onChange={handleFiltersChange} />

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          加载失败，请稍后重试
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          <UserList
            users={data.users}
            loading={mutationLoading}
            onDelete={handleDelete}
            onRestore={handleRestore}
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
    </div>
  );
}
