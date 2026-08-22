"use client";

import { useState, useCallback, Suspense } from "react";
import { useSWRConfig } from "swr";
import { DownloadIcon, Loader2Icon } from "lucide-react";

import type { AdminAuditLogListParams } from "@/lib/api/types";
import { useAdminAuditLogs, buildAdminAuditLogsKey } from "@/hooks/use-admin-audit-logs";
import { useAdminAuditLogListParams } from "@/hooks/use-admin-list-params";
import { PAGE_SIZE_OPTIONS } from "@/lib/admin/list-query";
import { message } from "@/lib/message";
import {
  AUDIT_EXPORT_MAX_ROWS,
  buildAuditExportFilename,
  downloadAuditLogsJson,
  fetchAllAuditLogs,
  formatAuditLogsJson,
} from "@/lib/admin/audit-export";
import { AuditLogFilters } from "@/components/admin/audit-log-filters";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { Pagination } from "@/components/admin/pagination";
import { AdminErrorState } from "@/components/admin/error-state";
import { DotLoading } from "@/components/ui/dot-loading";
import { Button } from "@/components/ui/button";

function AdminAuditLogsContent() {
  const { mutate } = useSWRConfig();
  // Filters/page live in the URL: refreshing or coming back keeps the same view.
  const [filters, setFilters] = useAdminAuditLogListParams();
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, error } = useAdminAuditLogs(filters);

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters({ ...filters, page });
    },
    [filters, setFilters],
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      setFilters({ ...filters, page: 1, page_size: pageSize });
    },
    [filters, setFilters],
  );

  const handleFiltersChange = useCallback(
    (next: AdminAuditLogListParams) => {
      setFilters(next);
    },
    [setFilters],
  );

  const handleExport = useCallback(async () => {
    if (exporting) return;
    const total = data?.total ?? 0;
    if (total > AUDIT_EXPORT_MAX_ROWS) {
      message.warning(`当前筛选结果共 ${total} 条，超过导出上限 ${AUDIT_EXPORT_MAX_ROWS} 条，请缩小筛选范围`);
      return;
    }
    setExporting(true);
    try {
      const logs = await fetchAllAuditLogs(filters);
      if (logs.length === 0) {
        message.warning("当前筛选条件下没有可导出的日志");
        return;
      }
      const json = formatAuditLogsJson(logs);
      downloadAuditLogsJson(json, buildAuditExportFilename());
      message.success(`已导出 ${logs.length} 条审计日志`);
    } catch {
      message.error("导出失败，请稍后重试");
    } finally {
      setExporting(false);
    }
  }, [exporting, data, filters]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-title2">审计日志</h1>        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting || isLoading || !data}
        >
          {exporting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <DownloadIcon className="size-4" />
          )}
          {exporting ? "导出中…" : "导出当前筛选结果"}
        </Button>
      </div>

      <AuditLogFilters value={filters} onChange={handleFiltersChange} />

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      )}

      {error && (
        <AdminErrorState onRetry={() => mutate(buildAdminAuditLogsKey(filters))} />
      )}

      {!isLoading && !error && data && (
        <>
          <AuditLogList logs={data.logs} />
          <Pagination
            page={data.page}
            pageSize={data.page_size}
            total={data.total}
            onChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </>
      )}
    </div>
  );
}

export default function AdminAuditLogsPage() {
  // useSearchParams (inside useAdminAuditLogListParams) suspends on a page load.
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      }
    >
      <AdminAuditLogsContent />
    </Suspense>
  );
}
