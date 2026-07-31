"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useAdminUser } from "@/hooks/use-admin-users";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { UserDetailCard } from "@/components/admin/user-detail-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { BackButton } from "@/components/navigation/back-button";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";

export function AdminUserDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { data: user, isLoading, error } = useAdminUser(id);
  const { deleteUser, restoreUser, isLoading: mutationLoading } = useAdminMutations();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    await deleteUser(user.id);
    setConfirmOpen(false);
    router.push("/admin/users");
  };

  const handleRestore = async () => {
    if (!user) return;
    await restoreUser(user.id);
    setConfirmOpen(false);
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><DotLoading /></div>;
  }

  if (error || !user) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-tertiary">用户不存在或加载失败</p>
        <Button variant="outline" asChild><Link href="/admin/users">返回用户列表</Link></Button>
      </div>
    );
  }

  const isDeleted = user.state === "is_deleted";

  return (
    <div className="flex flex-col gap-8">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-title2">{user.name}</h1>
          <p className="mt-1 text-sm text-tertiary">{user.login_email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild><Link href={`/admin/users/${user.id}/edit`}>编辑</Link></Button>
          <Button
            variant={isDeleted ? "default" : "destructive"}
            onClick={() => setConfirmOpen(true)}
            disabled={mutationLoading}
          >
            {isDeleted ? "恢复" : "注销"}
          </Button>
        </div>
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
