import type {
  AdminAuditLog,
  AdminAuditLogListData,
  AdminAuditLogListParams,
  AdminBatchRoleUpdateData,
  AdminBatchRoleUpdateRequest,
  AdminBatchRoleUpdateResult,
  AdminBatchUsersData,
  AdminCreateOAuthClientRequest,
  AdminOAuthClient,
  AdminUpdateOAuthClientRequest,
  AdminUpdateUserRequest,
  AdminUserListData,
  AdminUserListParams,
  ApiEnvelope,
  UserProfileData,
} from "./types";
import { apiClient } from "./client";

export interface AdminStatsData {
  users: {
    total: number;
    by_role: Record<string, number>;
    by_state: Record<string, number>;
    by_department: Record<string, number>;
    no_department: number;
    /** Live accounts still V010-flagged incomplete whose role is not lecturer
     *  or admin, grouped by role. The overview subtracts these from by_role
     *  and folds them into a single 未补全 slice.
     *
     *  Optional: these two keys ship in a later backend release than this
     *  field, so a frontend deployed first must render without them. */
    incomplete_by_role?: Record<string, number>;
    /** Live accounts still incomplete in the in-school student state (njupter),
     *  grouped by state. Subtracted from by_state into 未补全. Optional for the
     *  same deploy-order reason as incomplete_by_role. */
    incomplete_by_state?: Record<string, number>;
  };
  clients: { total: number; active: number };
  audit: { recent: AdminAuditLog[] };
}

export function getAdminStats() {
  return apiClient.get<ApiEnvelope<AdminStatsData>>("/admin/stats");
}

export function getAdminUsers(params?: AdminUserListParams) {
  return apiClient.get<ApiEnvelope<AdminUserListData>>("/admin/users", { params });
}

export function getAdminUser(id: number) {
  return apiClient.get<ApiEnvelope<UserProfileData>>(`/admin/users/${id}`);
}

export function updateAdminUser(id: number, data: AdminUpdateUserRequest) {
  return apiClient.put<ApiEnvelope<{ message: string; user: UserProfileData }>>(
    `/admin/users/${id}`,
    data,
  );
}

export function deleteAdminUser(id: number) {
  return apiClient.delete<ApiEnvelope<{ message: string }>>(`/admin/users/${id}`);
}

export function restoreAdminUser(id: number) {
  return apiClient.put<ApiEnvelope<{ message: string; user: UserProfileData }>>(
    `/admin/users/${id}/restore`,
  );
}

/** Batch role change — admin-only. Backend dedupes ids and executes each item
 *  independently; caps the request at 500 ids (selection is single-page so
 *  this is never hit from the UI). */
export function updateAdminUsersRole(data: AdminBatchRoleUpdateRequest) {
  return apiClient.put<ApiEnvelope<AdminBatchRoleUpdateData>>("/admin/users", data);
}

/** Batch user query by ids — admin/lecturer readable. Backend caps at 100 ids
 *  and collapses duplicates. Contract-only; no UI consumes this yet. */
export function getAdminUsersBatch(ids: number[]) {
  return apiClient.get<ApiEnvelope<AdminBatchUsersData>>("/admin/users/batch", {
    params: { ids: ids.join(",") },
  });
}

/** Ids whose role change failed, or that the role batch did not report on.
 *  `roleResults === null` means role was not part of this edit. */
export function computeRoleFailedIds(
  ids: number[],
  roleResults: AdminBatchRoleUpdateResult[] | null,
): Set<number> {
  const failed = new Set<number>();
  if (!roleResults) return failed;
  const covered = new Set(roleResults.map((r) => r.id));
  for (const r of roleResults) if (!r.success) failed.add(r.id);
  for (const id of ids) if (!covered.has(id)) failed.add(id);
  return failed;
}

export interface BatchEditSummary {
  successCount: number;
  failedIds: number[];
  /** Deduplicated failure reasons, in first-failure (input-id) order. */
  reasons: string[];
}

/** Merges per-item role-batch outcomes with one-by-one update failures into a
 *  single summary. `successCount` is derived (never accumulated) so a user who
 *  fails on one phase is counted once. */
export function summarizeBatchEdit(params: {
  ids: number[];
  roleResults: AdminBatchRoleUpdateResult[] | null;
  singleUpdateFailures: ReadonlyMap<number, string>;
}): BatchEditSummary {
  const { ids, roleResults, singleUpdateFailures } = params;
  const reasonById = new Map<number, string>();
  for (const r of roleResults ?? []) if (r.reason) reasonById.set(r.id, r.reason);
  const covered = new Set((roleResults ?? []).map((r) => r.id));

  const failures = new Map<number, string>();
  for (const id of computeRoleFailedIds(ids, roleResults)) {
    failures.set(id, reasonById.get(id) ?? (covered.has(id) ? "更新失败" : "服务器未返回处理结果"));
  }
  for (const [id, reason] of singleUpdateFailures) failures.set(id, reason);

  const failedIds = ids.filter((id) => failures.has(id));
  const successCount = ids.length - failedIds.length;
  const reasons = Array.from(new Set(failedIds.map((id) => failures.get(id)!)));
  return { successCount, failedIds, reasons };
}

export function getAdminOAuthClients() {
  return apiClient.get<ApiEnvelope<{ clients: AdminOAuthClient[] }>>("/admin/oauth-clients");
}

export function createAdminOAuthClient(data: AdminCreateOAuthClientRequest) {
  // The backend answers the registration with a flat DTO (client fields +
  // client_secret), not wrapped in a `client` key.
  return apiClient.post<ApiEnvelope<AdminOAuthClient>>("/admin/oauth-clients", data);
}

export function updateAdminOAuthClient(id: number, data: AdminUpdateOAuthClientRequest) {
  return apiClient.put<ApiEnvelope<{ message: string }>>(`/admin/oauth-clients/${id}`, data);
}

export function deleteAdminOAuthClient(id: number) {
  return apiClient.delete<ApiEnvelope<{ message: string }>>(`/admin/oauth-clients/${id}`);
}

export function rotateAdminOAuthClientSecret(id: number) {
  return apiClient.post<ApiEnvelope<{ id: number; client_secret: string }>>(
    `/admin/oauth-clients/${id}/rotate-secret`,
  );
}

export function getAdminAuditLogs(params?: AdminAuditLogListParams) {
  return apiClient.get<ApiEnvelope<AdminAuditLogListData>>("/admin/audit-logs", { params });
}
