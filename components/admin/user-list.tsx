import Link from "next/link";

import type { UserProfileData } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";
import { adminUserDetailHref, adminUserEditHref } from "@/lib/admin-user-route";


interface UserListProps {
  users: UserProfileData[];
  loading?: boolean;
  /** Read-only mode (e.g. lecturer): hides selection and edit/restore actions. */
  canManage?: boolean;
  /** Serialized list filters, forwarded so detail/edit can return to this page. */
  listQuery?: string;
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

// The nine fixed columns add up to ~968px plus the flexible name column, so the
// table only fits from lg. Below that each user renders as a two-column card
// (mirroring components/admin/oauth-client-list.tsx) instead of collapsing into
// one undifferentiated stack of eight labelled lines.
//
// Written out as full literal class tokens: Tailwind scans source text, so these
// arbitrary values cannot be assembled at runtime.
const GRID_COLS = "grid-cols-[60px_1fr_120px_180px_80px_100px_80px_180px]";
const GRID_COLS_LG = "lg:grid-cols-[60px_1fr_120px_180px_80px_100px_80px_180px]";
const GRID_COLS_MANAGE =
  "grid-cols-[40px_60px_1fr_120px_180px_80px_100px_80px_180px]";
const GRID_COLS_MANAGE_LG =
  "lg:grid-cols-[40px_60px_1fr_120px_180px_80px_100px_80px_180px]";

/** On a card a cell spans the full width; the table restores it to one column. */
const CELL_SPAN_FULL = "col-span-2 lg:col-span-1";

// Card order: name leads (full width), then ID + 学号 side by side, 邮箱 full
// width, 角色 + 部门 side by side, 状态 and actions full width. DOM order must stay
// in the desktop column order, so mobile reordering goes through order-*.
// Literal per index — Tailwind cannot see a runtime `order-${n}`.
const ORDER_ID = "order-2 lg:order-none";
const ORDER_NAME = "order-first lg:order-none";
const ORDER_STUDENT_ID = "order-3 lg:order-none";
const ORDER_EMAIL = "order-4 lg:order-none";
const ORDER_ROLE = "order-5 lg:order-none";
const ORDER_DEPARTMENT = "order-6 lg:order-none";
const ORDER_STATE = "order-7 lg:order-none";
const ORDER_ACTIONS = "order-8 lg:order-none";

// The select checkbox is pulled out of the card flow and pinned to the top-right
// corner: as a grid child it would claim a whole 1fr column and leave half the
// first row empty. From lg it returns to its own narrow table column.
const CHECKBOX_FLOAT =
  "absolute right-0 top-4 lg:static lg:right-auto lg:top-auto";

export function UserList({
  users,
  loading = false,
  canManage = true,
  listQuery,
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
          "hidden gap-4 border-b border-hairline py-3 text-xs text-tertiary lg:grid",
          canManage ? GRID_COLS_MANAGE : GRID_COLS,
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
              "relative grid grid-cols-2 gap-x-4 gap-y-2 border-b border-hairline py-4 text-sm lg:items-center lg:gap-4",
              canManage ? GRID_COLS_MANAGE_LG : GRID_COLS_LG,
              selected && "bg-accent/40",
            )}
          >
            {canManage && (
              <input
                type="checkbox"
                aria-label={`选择 ${user.name}`}
                checked={selected}
                onChange={() => onToggleSelect?.(user.id)}
                className={cn(CHECKBOX_FLOAT, "size-4 accent-foreground")}
              />
            )}
            <Link
              href={adminUserDetailHref(user.id, listQuery)}
              className={cn(
                ORDER_ID,
                "admin-cell-label-lg text-tertiary transition-colors hover:text-link hover:underline",
              )}
              data-label="ID"
            >
              #{user.id}
            </Link>
            <div
              className={cn(
                ORDER_NAME,
                CELL_SPAN_FULL,
                // Leaves room for the floated checkbox on the card.
                canManage && "pr-8 lg:pr-0",
                "admin-cell-label-lg font-medium lg:min-w-0",
              )}
              data-label="姓名"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate" title={user.name}>
                  {user.name}
                </span>
                {user.profile_needs_completion && (
                  <span
                    title="该账号仍有必填资料待补全"
                    className="inline-flex shrink-0 items-center rounded bg-amber-400/15 px-1.5 py-0.5 text-xs text-amber-600"
                  >
                    待补全
                  </span>
                )}
              </span>
            </div>
            <div
              className={cn(
                ORDER_STUDENT_ID,
                "admin-cell-label-lg truncate text-tertiary lg:min-w-0",
              )}
              data-label="学号"
              title={user.student_id}
            >
              {user.student_id}
            </div>
            <div
              className={cn(
                ORDER_EMAIL,
                CELL_SPAN_FULL,
                "admin-cell-label-lg truncate text-tertiary lg:min-w-0",
              )}
              data-label="邮箱"
              title={user.login_email}
            >
              {user.login_email}
            </div>
            <div className={cn(ORDER_ROLE, "admin-cell-label-lg")} data-label="角色">
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded px-2 py-0.5 text-xs",
                  ROLE_BADGE[user.role] ?? "bg-muted text-muted-foreground",
                )}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
            <div
              className={cn(ORDER_DEPARTMENT, "admin-cell-label-lg text-tertiary")}
              data-label="部门"
            >
              {user.profile?.department ? DEPARTMENT_LABELS[user.profile.department] ?? user.profile.department : "-"}
            </div>
            <div
              className={cn(ORDER_STATE, "admin-cell-label-lg text-tertiary")}
              data-label="状态"
            >
              {STATE_LABELS[user.state] ?? user.state}
            </div>
            <div
              className={cn(
                ORDER_ACTIONS,
                CELL_SPAN_FULL,
                "flex items-center justify-end gap-2 whitespace-nowrap",
              )}
            >
              <Button variant="ghost" size="sm" asChild>
                <Link href={adminUserDetailHref(user.id, listQuery)}>查看</Link>
              </Button>
              {canManage && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={adminUserEditHref(user.id, listQuery)}>编辑</Link>
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
