import { getAdminAuditLogs } from "@/lib/api/admin";
import type {
  AdminAuditLog,
  AdminAuditLogListParams,
} from "@/lib/api/types";
import { pad2 } from "@/lib/admin/date-time";

/** 导出时单页拉取条数（分批翻页，避免单次请求过大）。 */
export const AUDIT_EXPORT_PAGE_SIZE = 500;

/** 单次导出的最大条数，超出由页面层拦截提示。 */
export const AUDIT_EXPORT_MAX_ROWS = 10_000;

/**
 * 按当前筛选条件循环拉取全部匹配日志。
 * 忽略列表分页（page/page_size），固定从第 1 页按 AUDIT_EXPORT_PAGE_SIZE 翻页，
 * 直到拉满后端 total 或触达导出上限。
 */
export async function fetchAllAuditLogs(
  filters: AdminAuditLogListParams,
): Promise<AdminAuditLog[]> {
  const collected: AdminAuditLog[] = [];
  let page = 1;

  for (;;) {
    if (collected.length >= AUDIT_EXPORT_MAX_ROWS) break;

    const response = await getAdminAuditLogs({
      ...filters,
      page,
      page_size: AUDIT_EXPORT_PAGE_SIZE,
    });
    const { logs, total } = response.data.data;

    collected.push(...logs);
    if (logs.length === 0 || collected.length >= total || logs.length < AUDIT_EXPORT_PAGE_SIZE) {
      break;
    }
    page += 1;
  }

  return collected.slice(0, AUDIT_EXPORT_MAX_ROWS);
}

/** 将日志数组序列化为 JSON 文档（每条日志的完整原始元数据）。 */
export function formatAuditLogsJson(logs: AdminAuditLog[]): string {
  return JSON.stringify(logs, null, 2);
}

/** 生成带时间戳的导出文件名（.json）。 */
export function buildAuditExportFilename(date = new Date()): string {
  const stamp =
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `-${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
  return `audit-logs-${stamp}.json`;
}

/** 触发浏览器下载（application/json，UTF-8 无 BOM，保持 JSON 解析器兼容）。 */
export function downloadAuditLogsJson(text: string, filename: string): void {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}