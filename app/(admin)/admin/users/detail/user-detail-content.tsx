"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { canManageUsers } from "@/components/admin/permissions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { UserDetailCard } from "@/components/admin/user-detail-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarFallbackChar, DEFAULT_AVATAR } from "@/lib/constants/profile";
import { BackButton } from "@/components/navigation/back-button";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { useAdminUser } from "@/hooks/use-admin-users";
import { adminUsersListHref, adminUserEditHref, parseAdminUserId, parseAdminUsersListQuery } from "@/lib/admin-user-route";
import { useUserProfileStore } from "@/store/use-user-profile-store";

export function AdminUserDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = parseAdminUserId(searchParams);
  // Carried over from the list so 返回/注销后跳转 lands on the same filtered page.
  const listQuery = parseAdminUsersListQuery(searchParams);
  const listHref = adminUsersListHref(listQuery);
  const { data: user, isLoading, error } = useAdminUser(id);
  const { deleteUser, restoreUser, isLoading: mutationLoading } = useAdminMutations();
  const canManage = canManageUsers(useUserProfileStore((state) => state.profile.role));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    await deleteUser(user.id);
    setConfirmOpen(false);
    router.push(listHref);
  };

  const handleRestore = async () => {
    if (!user) return;
    await restoreUser(user.id);
    setConfirmOpen(false);
  };

  if (id === null || error || !user && !isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-tertiary">用户不存在或链接无效</p>
        <Button variant="outline" asChild><Link href={listHref}>返回用户列表</Link></Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><DotLoading /></div>;
  }

  if (!user) return null;

  const isDeleted = user.state === "is_deleted";

  return (
    <div className="flex flex-col gap-8">
      <BackButton fallback={listHref} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar className="size-16 shrink-0 border border-hairline">
            <AvatarImage
              src={user.profile?.avatar ?? DEFAULT_AVATAR}
              alt={`${user.name} 的头像`}
            />
            <AvatarFallback className="text-xl">
              {avatarFallbackChar({ nickname: user.profile?.nickname ?? "" })}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="type-title2 truncate" title={user.name}>
              {user.name}
            </h1>
            <p className="mt-1 truncate text-sm text-tertiary" title={user.login_email}>
              {user.login_email}
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="outline" asChild><Link href={adminUserEditHref(user.id, listQuery)}>编辑</Link></Button>
            <Button
              variant={isDeleted ? "default" : "destructive"}
              onClick={() => setConfirmOpen(true)}
              disabled={mutationLoading}
            >
              {isDeleted ? "恢复" : "注销"}
            </Button>
          </div>
        )}
      </div>
      <UserDetailCard user={user} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isDeleted ? "确认恢复用户" : "确认注销用户"}
        description={isDeleted
          ? `确定要恢复用户「${user.name}」吗？`
          : `确定要注销用户「${user.name}」吗？注销后该用户将无法登录，但数据会被保留。`}
        confirmLabel={isDeleted ? "恢复" : "注销"}
        confirmVariant={isDeleted ? "default" : "destructive"}
        loading={mutationLoading}
        onConfirm={isDeleted ? handleRestore : handleDelete}
      />
    </div>
  );
}
