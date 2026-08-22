"use client";

import { useState } from "react";

import type { AdminAuditLog } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { formatAdminDate, AUDIT_ACTION_LABELS, AUDIT_RESOURCE_LABELS } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuditLogListProps {
  logs: AdminAuditLog[];
}

const METHOD_LABELS: Record<string, string> = {
  password: "密码登录",
  lark: "飞书登录",
  github: "GitHub 登录",
};

const FIELD_LABELS: Record<string, string> = {
  login_email: "邮箱",
  target_role: "目标角色",
  target_state: "目标状态",
};

/** Parse the action's detail payload into a readable one-liner. */
function summarizeDetail(detail: Record<string, unknown> | null | undefined): string {
  if (!detail || Object.keys(detail).length === 0) return "-";

  const parts: string[] = [];
  const handled = new Set<string>();

  if (detail.method) {
    parts.push(METHOD_LABELS[String(detail.method)] ?? `方式：${detail.method}`);
    handled.add("method");
  }
  if (detail.login_email) {
    parts.push(String(detail.login_email));
    handled.add("login_email");
  }
  if (Array.isArray(detail.changed_fields)) {
    parts.push(`修改字段：${detail.changed_fields.join("、")}`);
    handled.add("changed_fields");
  }
  for (const [key, value] of Object.entries(detail)) {
    if (handled.has(key)) continue;
    parts.push(
      `${FIELD_LABELS[key] ?? key}：${typeof value === "object" ? JSON.stringify(value) : value}`,
    );
  }
  return parts.join(" · ");
}

// Seven fixed-ish columns only fit from lg; below that each log renders as a
// two-column card (mirroring components/admin/oauth-client-list.tsx) instead of
// stacking into seven labelled lines. Literal class tokens — Tailwind scans
// source text and cannot see runtime-assembled arbitrary values or `order-${n}`.
const GRID_COLS = "grid-cols-[150px_90px_120px_110px_70px_1fr_60px]";
const GRID_COLS_LG = "lg:grid-cols-[150px_90px_120px_110px_70px_1fr_60px]";
/** On a card a cell spans the full width; the table restores it to one column. */
const CELL_SPAN_FULL = "col-span-2 lg:col-span-1";

// Card order: 操作 leads (it is what the row is about), then 时间 + 结果 side by
// side, 用户 + 资源 side by side, 信息 full width, JSON last.
const ORDER_TIME = "order-2 lg:order-none";
const ORDER_USER = "order-4 lg:order-none";
const ORDER_ACTION = "order-first lg:order-none";
const ORDER_RESOURCE = "order-5 lg:order-none";
const ORDER_SUCCESS = "order-3 lg:order-none";
const ORDER_DETAIL = "order-6 lg:order-none";
const ORDER_JSON = "order-7 lg:order-none";

export function AuditLogList({ logs }: AuditLogListProps) {
  const [rawLog, setRawLog] = useState<AdminAuditLog | null>(null);

  if (logs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center border-t border-hairline text-sm text-tertiary">
        没有找到审计日志
      </div>
    );
  }

  return (
    <div className="border-t border-hairline">
      <div
        className={cn(
          "hidden gap-4 border-b border-hairline py-3 text-xs text-tertiary lg:grid",
          GRID_COLS,
        )}
      >
        <div>时间</div>
        <div>用户 ID</div>
        <div>操作</div>
        <div>资源</div>
        <div>结果</div>
        <div>信息</div>
        <div>JSON</div>
      </div>
      {logs.map((log) => (
        <div
          key={log.id}
          className={cn(
            "grid grid-cols-2 gap-x-4 gap-y-2 border-b border-hairline py-4 text-sm lg:items-center lg:gap-4",
            GRID_COLS_LG,
          )}
        >
          <div
            className={cn(ORDER_TIME, "admin-cell-label-lg text-tertiary")}
            data-label="时间"
          >
            {formatAdminDate(log.created_at)}
          </div>
          <div
            className={cn(ORDER_USER, "admin-cell-label-lg truncate text-tertiary lg:min-w-0")}
            data-label="用户 ID"
          >
            {log.user_name ? `${log.user_name} (${log.user_id})` : log.user_id ?? "-"}
          </div>
          <div
            className={cn(ORDER_ACTION, CELL_SPAN_FULL, "admin-cell-label-lg font-medium lg:font-normal")}
            data-label="操作"
          >
            {AUDIT_ACTION_LABELS[log.action] ?? log.action}
          </div>
          <div
            className={cn(ORDER_RESOURCE, "admin-cell-label-lg text-tertiary")}
            data-label="资源"
          >
            {AUDIT_RESOURCE_LABELS[log.resource] ?? log.resource}
          </div>
          <div className={cn(ORDER_SUCCESS, "admin-cell-label-lg")} data-label="结果">
            <span
              className={cn(
                "inline-flex items-center rounded px-2 py-0.5 text-xs",
                log.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {log.success ? "成功" : "失败"}
            </span>
          </div>
          <div
            className={cn(
              ORDER_DETAIL,
              CELL_SPAN_FULL,
              "admin-cell-label-lg break-all text-tertiary lg:min-w-0 lg:truncate lg:break-normal",
            )}
            data-label="信息"
            title={summarizeDetail(log.detail)}
          >
            {summarizeDetail(log.detail)}
          </div>
          <div
            className={cn(ORDER_JSON, CELL_SPAN_FULL, "admin-cell-label-lg lg:col-span-1")}
            data-label="JSON"
          >
            <button
              type="button"
              onClick={() => setRawLog(log)}
              className="text-xs text-link hover:underline"
            >
              查看
            </button>
          </div>
        </div>
      ))}

      <Dialog open={rawLog !== null} onOpenChange={(open) => { if (!open) setRawLog(null); }}>
        <DialogContent className="border-border/60 bg-card/95 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="type-title3">原始日志</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              完整审计记录
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-all rounded bg-muted px-3 py-3 text-xs leading-5">
            {JSON.stringify(rawLog, null, 2)}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRawLog(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
