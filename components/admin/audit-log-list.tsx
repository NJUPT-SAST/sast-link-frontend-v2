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
      <div className="hidden grid-cols-[150px_90px_120px_110px_70px_1fr_60px] gap-4 border-b border-hairline py-3 text-xs text-tertiary lg:grid">
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
          className="grid grid-cols-1 gap-2 border-b border-hairline py-4 text-sm lg:grid-cols-[150px_90px_120px_110px_70px_1fr_60px] lg:items-center lg:gap-4"
        >
          <div className="text-tertiary">{formatAdminDate(log.created_at)}</div>
          <div className="text-tertiary">
            {log.user_name ? `${log.user_name} (${log.user_id})` : log.user_id ?? "-"}
          </div>
          <div>{AUDIT_ACTION_LABELS[log.action] ?? log.action}</div>
          <div className="text-tertiary">{AUDIT_RESOURCE_LABELS[log.resource] ?? log.resource}</div>
          <div>
            <span
              className={cn(
                "inline-flex items-center rounded px-2 py-0.5 text-xs",
                log.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {log.success ? "成功" : "失败"}
            </span>
          </div>
          <div className="truncate text-tertiary">{summarizeDetail(log.detail)}</div>
          <div>
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
