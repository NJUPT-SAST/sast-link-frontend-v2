import {
  parseAdminUserListParams,
  serializeAdminUserListParams,
} from "@/lib/admin/list-query";

const userIdPattern = /^[1-9]\d*$/;

/**
 * Detail/edit URLs carry the list's filter+page state under this key, so
 * "返回用户列表" (and post-delete redirects) land on the exact page the admin
 * came from — even on a direct visit or after a refresh, where history.back()
 * has nothing useful to go to.
 */
export const ADMIN_USERS_LIST_PARAM = "list";

export function parseAdminUserId(searchParams: Pick<URLSearchParams, "get">): number | null {
  const value = searchParams.get("id");
  if (!value || !userIdPattern.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

/**
 * Round-trips the stashed query through the list parser so a hand-edited URL can
 * only ever produce whitelisted filters.
 */
export function parseAdminUsersListQuery(
  searchParams: Pick<URLSearchParams, "get">,
): string {
  const raw = searchParams.get(ADMIN_USERS_LIST_PARAM);
  if (!raw) return "";
  return serializeAdminUserListParams(parseAdminUserListParams(new URLSearchParams(raw)));
}

export function adminUsersListHref(listQuery?: string): string {
  return listQuery ? `/admin/users?${listQuery}` : "/admin/users";
}

function withListQuery(base: string, listQuery?: string): string {
  if (!listQuery) return base;
  return `${base}&${ADMIN_USERS_LIST_PARAM}=${encodeURIComponent(listQuery)}`;
}

export function adminUserDetailHref(id: number, listQuery?: string): string {
  return withListQuery(`/admin/users/detail?id=${id}`, listQuery);
}

export function adminUserEditHref(id: number, listQuery?: string): string {
  return withListQuery(`/admin/users/edit?id=${id}`, listQuery);
}
