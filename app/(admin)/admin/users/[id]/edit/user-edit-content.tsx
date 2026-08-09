"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import type { AdminUpdateUserRequest } from "@/lib/api/types";
import { useAdminUser } from "@/hooks/use-admin-users";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { UserEditForm } from "@/components/admin/user-edit-form";
import { BackButton } from "@/components/navigation/back-button";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";

export function AdminUserEditContent() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { data: user, isLoading } = useAdminUser(id);
  const { updateUser, isLoading: mutationLoading } = useAdminMutations();

  const handleSubmit = async (data: AdminUpdateUserRequest) => {
    await updateUser(id, data);
    router.push(`/admin/users/${id}`);
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><DotLoading /></div>;
  }

  if (!user) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-tertiary">用户不存在或加载失败</p>
        <Button variant="outline" asChild><Link href="/admin/users">返回用户列表</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <BackButton fallback="/admin/users" />
      <div>
        <h1 className="type-title2">编辑用户</h1>
        <p className="mt-1 text-sm text-tertiary">{user.name} · {user.login_email}</p>
      </div>
      <UserEditForm user={user} onSubmit={handleSubmit} loading={mutationLoading} />
    </div>
  );
}
