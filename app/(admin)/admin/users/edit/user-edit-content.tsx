"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { canManageUsers } from "@/components/admin/permissions";
import { UserEditForm } from "@/components/admin/user-edit-form";
import { BackButton } from "@/components/navigation/back-button";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { useAdminUser } from "@/hooks/use-admin-users";
import { adminUserDetailHref, adminUsersListHref, parseAdminUserId, parseAdminUsersListQuery } from "@/lib/admin-user-route";
import type { AdminUpdateUserRequest } from "@/lib/api/types";
import { useUserProfileStore } from "@/store/use-user-profile-store";

export function AdminUserEditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = parseAdminUserId(searchParams);
  // Carried over from the list so 返回/保存后跳转 keeps the same filtered page.
  const listQuery = parseAdminUsersListQuery(searchParams);
  const listHref = adminUsersListHref(listQuery);
  const { data: user, isLoading } = useAdminUser(id);
  const { updateUser, isLoading: mutationLoading } = useAdminMutations();
  const canManage = canManageUsers(useUserProfileStore((state) => state.profile.role));

  useEffect(() => {
    if (!canManage) router.replace(listHref);
  }, [canManage, router, listHref]);

  const handleSubmit = async (data: AdminUpdateUserRequest) => {
    if (id === null) return;
    await updateUser(id, data);
    router.push(adminUserDetailHref(id, listQuery));
  };

  if (!canManage) {
    return <div className="flex h-64 items-center justify-center text-sm text-tertiary">正在跳转…</div>;
  }

  if (id === null || !user && !isLoading) {
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

  return (
    <div className="flex flex-col gap-8">
      <BackButton fallback={listHref} />
      <div>
        <h1 className="type-title2">编辑用户</h1>
        <p className="mt-1 text-sm text-tertiary">{user.name} · {user.login_email}</p>
      </div>
      <UserEditForm
        user={user}
        onSubmit={handleSubmit}
        loading={mutationLoading}
        cancelFallback={listHref}
      />
    </div>
  );
}
