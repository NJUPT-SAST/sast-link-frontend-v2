"use client";

import { useState, useCallback } from "react";

import type { AdminAuditLogListParams } from "@/lib/api/types";
import { useAdminAuditLogs } from "@/hooks/use-admin-audit-logs";
import { AuditLogFilters } from "@/components/admin/audit-log-filters";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { Pagination } from "@/components/admin/pagination";
import { DotLoading } from "@/components/ui/dot-loading";

export default function AdminAuditLogsPage() {
  const [filters, setFilters] = useState<AdminAuditLogListParams>({ page: 1, page_size: 20 });
  const { data, isLoading, error } = useAdminAuditLogs(filters);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 1, page_size: pageSize }));
  }, []);

  const handleFiltersChange = useCallback((next: AdminAuditLogListParams) => {
    setFilters(next);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="type-title2">审计日志</h1>
        <p className="mt-1 text-sm text-tertiary">查看系统操作记录</p>
      </div>

      <AuditLogFilters value={filters} onChange={handleFiltersChange} />

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          加载失败，请稍后重试
        </div>
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
          />
        </>
      )}
    </div>
  );
}
