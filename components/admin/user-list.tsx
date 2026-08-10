import Link from "next/link";

import type { UserProfileData } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";

interface UserListProps {
  users: UserProfileData[];
  loading?: boolean;
  /** Read-only mode (e.g. lecturer): hides selection and edit/restore actions. */
  canManage?: boolean;
  onRestore?: (user: UserProfileData) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: (checked: boolean) => void;
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-link/10 text-link",
  lecturer: "bg-accent text-accent-foreground",
  member: "bg-secondary text-secondary-foreground",
  freshman: "bg-muted text-muted-foreground",
};

export function UserList({
  users,
  loading = false,
  canManage = true,
  onRestore,
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
}: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center border-t border-hairline text-sm text-tertiary">
        没有找到用户
      </div>
    );
  }

  const allSelected = canManage && users.length > 0 && users.every((u) => selectedIds.has(u.id));

  return (
    <div className="border-t border-hairline">
      <div
        className={cn(
          "hidden grid-cols-[60px_1fr_120px_180px_80px_100px_80px_180px] gap-4 border-b border-hairline py-3 text-xs text-tertiary sm:grid",
          canManage && "sm:grid-cols-[40px_60px_1fr_120px_180px_80px_100px_80px_180px]",
        )}
      >
        {canManage && (
          <input
            type="checkbox"
            aria-label="全选本页用户"
            checked={allSelected}
            onChange={(event) => onToggleSelectAll?.(event.target.checked)}
            className="size-4 accent-foreground"
          />
        )}
        <div>ID</div>
        <div>姓名</div>
        <div>学号</div>
        <div>邮箱</div>
        <div>角色</div>
        <div>部门</div>
        <div>状态</div>
        <div className="text-right" aria-hidden />
      </div>
      {users.map((user) => {
        const selected = canManage && selectedIds.has(user.id);
        return (
          <div
            key={user.id}
            className={cn(
              "grid grid-cols-1 gap-2 border-b border-hairline py-4 text-sm sm:grid-cols-[60px_1fr_120px_180px_80px_100px_80px_180px] sm:items-center sm:gap-4",
              canManage &&
                "sm:grid-cols-[40px_60px_1fr_120px_180px_80px_100px_80px_180px]",
              selected && "bg-accent/40",
            )}
          >
            {canManage && (
              <input
                type="checkbox"
                aria-label={`选择 ${user.name}`}
                checked={selected}
                onChange={() => onToggleSelect?.(user.id)}
                className="size-4 accent-foreground"
              />
            )}
            <Link
              href={`/admin/users/${user.id}`}
              className="text-tertiary transition-colors hover:text-link hover:underline"
            >
              #{user.id}
            </Link>
            <div className="font-medium">{user.name}</div>
            <div className="text-tertiary">{user.student_id}</div>
            <div className="truncate text-tertiary">{user.login_email}</div>
            <div>
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded px-2 py-0.5 text-xs",
                  ROLE_BADGE[user.role] ?? "bg-muted text-muted-foreground",
                )}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
            <div className="text-tertiary">
              {user.profile?.department ? DEPARTMENT_LABELS[user.profile.department] ?? user.profile.department : "-"}
            </div>
            <div className="text-tertiary">
              {STATE_LABELS[user.state] ?? user.state}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/users/${user.id}`}>查看</Link>
              </Button>
              {canManage && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/users/${user.id}/edit`}>编辑</Link>
                  </Button>
                  {user.state === "is_deleted" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestore?.(user)}
                      disabled={loading}
                    >
                      恢复
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
