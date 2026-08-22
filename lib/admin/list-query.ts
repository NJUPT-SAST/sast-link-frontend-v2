/**
 * 管理列表筛选条件 ↔ URL query string 的双向映射。
 *
 * 列表页把筛选与页码同步进地址栏，才能让「查看/编辑某用户 → 返回」回到原来那一页
 * （返回按钮走 history.back，恢复的是带 query 的 URL），刷新也不丢筛选。
 *
 * 解析一律做白名单校验并静默丢弃非法值：URL 是用户可编辑的输入，脏参数只应退化为
 * 默认筛选，不能把非法值透传给后端。
 */
import type {
  AdminAuditLogListParams,
  AdminUserListParams,
  Department,
  UserRole,
  UserState,
} from "@/lib/api/types";

export const DEFAULT_PAGE_SIZE = 20;
/** 与 Pagination 的每页条数下拉、后端 page_size 上限保持一致。 */
export const PAGE_SIZE_OPTIONS = [20, 50, 100];

const USER_ROLES: UserRole[] = ["freshman", "member", "lecturer", "admin"];
const USER_STATES: UserState[] = ["njupter", "on_sast", "retired_sast", "is_deleted"];
const DEPARTMENTS: Department[] = [
  "software",
  "media",
  "electronics",
  "office",
  "publicity",
  "outreach",
];

type SearchParamsLike = Pick<URLSearchParams, "get">;

function parsePositiveInt(value: string | null, max?: number): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return undefined;
  if (max !== undefined && parsed > max) return undefined;
  return parsed;
}

function parseEnum<T extends string>(value: string | null, allowed: T[]): T | undefined {
  return value && (allowed as string[]).includes(value) ? (value as T) : undefined;
}

function parseBool(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

/** 空串/纯空白视为「未筛选」，避免 `?keyword=` 这种噪声参数打到后端。 */
function parseText(value: string | null, maxLength = 255): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > maxLength) return undefined;
  return trimmed;
}

export function parseAdminUserListParams(
  searchParams: SearchParamsLike,
): AdminUserListParams {
  return {
    page: parsePositiveInt(searchParams.get("page")) ?? 1,
    page_size: parsePositiveInt(searchParams.get("page_size"), 100) ?? DEFAULT_PAGE_SIZE,
    role: parseEnum(searchParams.get("role"), USER_ROLES),
    state: parseEnum(searchParams.get("state"), USER_STATES),
    department: parseEnum(searchParams.get("department"), DEPARTMENTS),
    student_id: parseText(searchParams.get("student_id")),
    keyword: parseText(searchParams.get("keyword")),
    needs_completion: parseBool(searchParams.get("needs_completion")),
  };
}

export function serializeAdminUserListParams(params: AdminUserListParams): string {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.page_size && params.page_size !== DEFAULT_PAGE_SIZE)
    search.set("page_size", String(params.page_size));
  if (params.role) search.set("role", params.role);
  if (params.state) search.set("state", params.state);
  if (params.department) search.set("department", params.department);
  if (params.student_id) search.set("student_id", params.student_id);
  if (params.keyword) search.set("keyword", params.keyword);
  if (params.needs_completion !== undefined)
    search.set("needs_completion", String(params.needs_completion));
  return search.toString();
}

export function parseAdminAuditLogListParams(
  searchParams: SearchParamsLike,
): AdminAuditLogListParams {
  return {
    page: parsePositiveInt(searchParams.get("page")) ?? 1,
    page_size: parsePositiveInt(searchParams.get("page_size"), 100) ?? DEFAULT_PAGE_SIZE,
    user_id: parsePositiveInt(searchParams.get("user_id")),
    action: parseText(searchParams.get("action")),
    resource: parseText(searchParams.get("resource")),
    success: parseBool(searchParams.get("success")),
    start_time: parseText(searchParams.get("start_time"), 64),
    end_time: parseText(searchParams.get("end_time"), 64),
  };
}

export function serializeAdminAuditLogListParams(
  params: AdminAuditLogListParams,
): string {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.page_size && params.page_size !== DEFAULT_PAGE_SIZE)
    search.set("page_size", String(params.page_size));
  if (params.user_id) search.set("user_id", String(params.user_id));
  if (params.action) search.set("action", params.action);
  if (params.resource) search.set("resource", params.resource);
  if (params.success !== undefined) search.set("success", String(params.success));
  if (params.start_time) search.set("start_time", params.start_time);
  if (params.end_time) search.set("end_time", params.end_time);
  return search.toString();
}
