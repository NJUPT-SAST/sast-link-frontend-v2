import Link from "next/link";

import type { UserProfileData } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";

interface UserListProps {
  users: UserProfileData[];
  loading?: boolean;
  onDelete?: (user: UserProfileData) => void;
  onRestore?: (user: UserProfileData) => void;
}

export function UserList({ users, loading = false, onDelete, onRestore }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center border-t border-hairline text-sm text-tertiary">
        没有找到用户
      </div>
    );
  }

  return (
    <div className="border-t border-hairline">
      <div className="hidden grid-cols-[60px_1fr_120px_180px_80px_80px_100px_140px] gap-4 border-b border-hairline py-3 text-xs text-tertiary sm:grid">
        <div>ID</div>
        <div>姓名</div>
        <div>学号</div>
        <div>邮箱</div>
        <div>角色</div>
        <div>状态</div>
        <div>部门</div>
        <div className="text-right">操作</div>
      </div>
      {users.map((user) => (
        <div
          key={user.id}
          className="grid grid-cols-1 gap-2 border-b border-hairline py-4 text-sm sm:grid-cols-[60px_1fr_120px_180px_80px_80px_100px_140px] sm:items-center sm:gap-4"
        >
          <div className="text-tertiary">#{user.id}</div>
          <div className="font-medium">{user.name}</div>
          <div className="text-tertiary">{user.student_id}</div>
          <div className="truncate text-tertiary">{user.login_email}</div>
          <div>{ROLE_LABELS[user.role] ?? user.role}</div>
          <div
            className={cn(
              "inline-flex w-fit items-center rounded px-2 py-0.5 text-xs",
              user.state === "is_deleted"
                ? "bg-destructive/10 text-destructive"
                : user.state === "on_sast"
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {STATE_LABELS[user.state] ?? user.state}
          </div>
          <div className="text-tertiary">
            {user.profile?.department ? DEPARTMENT_LABELS[user.profile.department] ?? user.profile.department : "-"}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/users/${user.id}`}>查看</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/users/${user.id}/edit`}>编辑</Link>
            </Button>
            {user.state === "is_deleted" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore?.(user)}
                disabled={loading}
              >
                恢复
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete?.(user)}
                disabled={loading}
              >
                注销
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
