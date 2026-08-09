import type {
  AdminAuditLog,
  AdminAuditLogListData,
  AdminAuditLogListParams,
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

export function getAdminOAuthClients() {
  return apiClient.get<ApiEnvelope<{ clients: AdminOAuthClient[] }>>("/admin/oauth-clients");
}

export function createAdminOAuthClient(data: AdminCreateOAuthClientRequest) {
  return apiClient.post<ApiEnvelope<{ client: AdminOAuthClient }>>("/admin/oauth-clients", data);
}

export function updateAdminOAuthClient(id: number, data: AdminUpdateOAuthClientRequest) {
  return apiClient.put<ApiEnvelope<{ message: string; client: AdminOAuthClient }>>(
    `/admin/oauth-clients/${id}`,
    data,
  );
}

export function getAdminAuditLogs(params?: AdminAuditLogListParams) {
  return apiClient.get<ApiEnvelope<AdminAuditLogListData>>("/admin/audit-logs", { params });
}
