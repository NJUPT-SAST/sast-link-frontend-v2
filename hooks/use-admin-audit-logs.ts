"use client";

import useSWR from "swr";

import type { AdminAuditLogListParams } from "@/lib/api/types";
import { getAdminAuditLogs } from "@/lib/api/admin";
import { getSession } from "@/lib/token";

export function buildAdminAuditLogsKey(params?: AdminAuditLogListParams) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));
  if (params?.user_id) search.set("user_id", String(params.user_id));
  if (params?.action) search.set("action", params.action);
  if (params?.resource) search.set("resource", params.resource);
  if (params?.success !== undefined) search.set("success", String(params.success));
  if (params?.start_time) search.set("start_time", params.start_time);
  if (params?.end_time) search.set("end_time", params.end_time);
  return `admin-audit-logs?${search.toString()}`;
}

export function useAdminAuditLogs(params?: AdminAuditLogListParams) {
  return useSWR(
    () => (getSession() ? buildAdminAuditLogsKey(params) : null),
    async () => {
      const response = await getAdminAuditLogs(params);
      return response.data.data;
    },
    { revalidateOnFocus: false },
  );
}
