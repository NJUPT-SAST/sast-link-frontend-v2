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
