"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import type {
  AdminAuditLogListParams,
  AdminUserListParams,
  AlumniRequestListParams,
} from "@/lib/api/types";
import {
  parseAdminAuditLogListParams,
  parseAdminUserListParams,
  parseAlumniRequestListParams,
  serializeAdminAuditLogListParams,
  serializeAdminUserListParams,
  serializeAlumniRequestListParams,
} from "@/lib/admin/list-query";

/**
 * 列表筛选状态 + URL 同步。
 *
 * 状态仍以组件内 state 为准（渲染立即生效），每次变更用 history.replaceState 把
 * 筛选写回地址栏。这样：
 * - 进详情/编辑页再返回时列表重新挂载，初始状态从 URL 还原 → 停在原来那一页；
 * - 刷新不丢筛选；
 * - 用 replaceState 而不是 push，翻页不会往历史里堆一串条目（详情页的返回按钮
 *   走 history.back，仍会落回带筛选的列表 URL）。
 */
function useUrlSyncedParams<T>(
  parse: (searchParams: URLSearchParams) => T,
  serialize: (params: T) => string,
): [T, (next: T) => void] {
  const searchParams = useSearchParams();
  // 仅初始化时读一次 URL：后续以 state 为准，避免 replaceState 与 state 互相打架。
  const [params, setParams] = useState<T>(() =>
    parse(new URLSearchParams(searchParams.toString())),
  );

  const update = useCallback(
    (next: T) => {
      setParams(next);
      if (typeof window === "undefined") return;
      const query = serialize(next);
      window.history.replaceState(
        null,
        "",
        query ? `${window.location.pathname}?${query}` : window.location.pathname,
      );
    },
    [serialize],
  );

  return [params, update];
}

export function useAdminUserListParams() {
  return useUrlSyncedParams<AdminUserListParams>(
    parseAdminUserListParams,
    serializeAdminUserListParams,
  );
}

export function useAdminAuditLogListParams() {
  return useUrlSyncedParams<AdminAuditLogListParams>(
    parseAdminAuditLogListParams,
    serializeAdminAuditLogListParams,
  );
}

export function useAlumniRequestListParams() {
  return useUrlSyncedParams<AlumniRequestListParams>(
    parseAlumniRequestListParams,
    serializeAlumniRequestListParams,
  );
}
