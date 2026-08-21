import type { AdminAuditLog, AdminOAuthClient } from "@/lib/api/types";

const createdAt = "2026-01-01T00:00:00Z";

// Audit timestamps are spread relative to "today" (built in local time) so the
// calendar filters (today / yesterday / this week / this month) actually select
// different subsets when developing against the mock.
//
// The reference instant is captured once at module load rather than read per
// call, so every log in one process shares a single "now" and a run that spans
// midnight cannot produce an inconsistent set.
const NOW = new Date();

function mockTime(daysAgo: number, hour: number): string {
  const at = new Date(NOW);
  at.setDate(at.getDate() - daysAgo);
  at.setHours(hour, (daysAgo * 17) % 60, 0, 0);
  return at.toISOString();
}

function mockAuditLog(entry: {
  id: number;
  user: { id: number; name: string };
  action: string;
  resource: string;
  resourceId: number;
  detail: Record<string, unknown> | null;
  createdAt: string;
  success?: boolean;
  errCode?: number | null;
}): AdminAuditLog {
  return {
    id: entry.id,
    user_id: entry.user.id,
    user_name: entry.user.name,
    action: entry.action,
    resource: entry.resource,
    resource_id: String(entry.resourceId),
    detail: entry.detail,
    client_ip: "10.0.0.1",
    user_agent: "Mozilla/5.0",
    success: entry.success ?? true,
    err_code: entry.errCode ?? null,
    created_at: entry.createdAt,
  };
}

export const adminMockOAuthClients: AdminOAuthClient[] = [
  {
    id: 1,
    client_id: "sast-link-web",
    client_name: "SAST Link Web",
    client_type: "first_party",
    redirect_uris: ["https://link.sast.fun/callback"],
    grant_types: ["authorization_code", "refresh_token"],
    scopes: ["openid", "profile", "email"],
    is_active: true,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: 2,
    client_id: "9f3a1c7d2e5b40a8c6d1f4b7a2e9c3d5",
    client_name: "Evento",
    client_type: "third_party",
    redirect_uris: ["https://evento.sast.fun/oauth"],
    grant_types: ["authorization_code", "refresh_token"],
    scopes: ["openid", "profile"],
    is_active: true,
    created_at: createdAt,
    updated_at: createdAt,
  },
];

export const adminMockAuditLogs: AdminAuditLog[] = [
  mockAuditLog({
    id: 1,
    user: { id: 2, name: "Admin" },
    action: "admin_user_update",
    resource: "user",
    resourceId: 1,
    detail: { sub_action: "edit_user", target_user_id: 1 },
    createdAt: mockTime(0, 9), // 今天 09:xx
  }),
  mockAuditLog({
    id: 2,
    user: { id: 1, name: "Alice" },
    action: "login",
    resource: "session",
    resourceId: 1,
    detail: { method: "password", login_email: "user1@njupt.edu.cn" },
    createdAt: mockTime(0, 14), // 今天 14:xx
  }),
  mockAuditLog({
    id: 3,
    user: { id: 3, name: "Lecturer" },
    action: "login",
    resource: "session",
    resourceId: 3,
    detail: { method: "lark", login_email: "user3@njupt.edu.cn" },
    createdAt: mockTime(1, 11), // 昨天 11:xx
  }),
  mockAuditLog({
    id: 4,
    user: { id: 1, name: "Alice" },
    action: "update_profile",
    resource: "user",
    resourceId: 1,
    detail: { changed_fields: ["intro"] },
    createdAt: mockTime(3, 8), // 3 天前 08:xx
  }),
  mockAuditLog({
    id: 5,
    user: { id: 2, name: "Admin" },
    action: "upload_avatar",
    resource: "user",
    resourceId: 2,
    detail: null,
    createdAt: mockTime(6, 16), // 6 天前 16:xx
  }),
  mockAuditLog({
    id: 6,
    user: { id: 4, name: "Bob" },
    action: "admin_user_delete",
    resource: "user",
    resourceId: 3,
    detail: { sub_action: "delete_user", target_user_id: 3 },
    createdAt: mockTime(20, 10), // 20 天前 10:xx（本月内）
    success: false,
    errCode: 40300,
  }),
  mockAuditLog({
    id: 7,
    user: { id: 2, name: "Admin" },
    action: "admin_oauth_client_rotate_secret",
    resource: "oauth_client",
    resourceId: 2,
    detail: { sub_action: "rotate_secret" },
    createdAt: mockTime(40, 15), // 40 天前 15:xx（上个月前）
  }),
];
