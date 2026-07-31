import type { AdminAuditLog } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { formatAdminDate, AUDIT_ACTION_LABELS, AUDIT_RESOURCE_LABELS } from "@/lib/constants/admin";

interface AuditLogListProps {
  logs: AdminAuditLog[];
}

export function AuditLogList({ logs }: AuditLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center border-t border-hairline text-sm text-tertiary">
        没有找到审计日志
      </div>
    );
  }

  return (
    <div className="border-t border-hairline">
      <div className="hidden grid-cols-[180px_80px_120px_120px_100px_1fr] gap-4 border-b border-hairline py-3 text-xs text-tertiary lg:grid">
        <div>时间</div>
        <div>用户 ID</div>
        <div>操作</div>
        <div>资源</div>
        <div>结果</div>
        <div>详情</div>
      </div>
      {logs.map((log) => (
        <div
          key={log.id}
          className="grid grid-cols-1 gap-2 border-b border-hairline py-4 text-sm lg:grid-cols-[180px_80px_120px_120px_100px_1fr] lg:items-center lg:gap-4"
        >
          <div className="text-tertiary">{formatAdminDate(log.created_at)}</div>
          <div className="text-tertiary">{log.user_id ?? "-"}</div>
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
          <div className="truncate text-tertiary">
            {log.detail ? JSON.stringify(log.detail) : "-"}
          </div>
        </div>
      ))}
    </div>
  );
}
