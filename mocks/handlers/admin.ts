import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import type {
  AdminAuditLog,
  AdminAuditLogListParams,
  AdminCreateOAuthClientRequest,
  AdminOAuthClient,
  AdminUpdateOAuthClientRequest,
  AdminUpdateUserRequest,
  AdminUserListParams,
  Department,
  UserProfileData,
  UserRole,
  UserState,
} from "@/lib/api/types";
import { adminMockAuditLogs, adminMockOAuthClients } from "../data/admin";
import { findUserByAccessToken, mockUsers } from "../data/users";

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ code: 0, message: "ok", data }, { status });
}

function fail(status: number, code: number, message: string) {
  return HttpResponse.json({ code, message, data: null }, { status });
}

interface AuthResult {
  user?: ReturnType<typeof findUserByAccessToken>;
  response?: ReturnType<typeof fail>;
}

function authenticatedAdmin(request: Request, allowLecturer = false): AuthResult {
  const value = request.headers.get("Authorization");
  const user = value?.startsWith("Bearer ") ? findUserByAccessToken(value.slice(7)) : undefined;
  if (!user) return { response: fail(401, 40100, "未登录") };
  if (user.profile.role !== "admin" && !(allowLecturer && user.profile.role === "lecturer")) {
    return { response: fail(403, 40300, "无权限") };
  }
  return { user };
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
}

function parseSearchParams(request: Request): Record<string, string> {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const CLIENT_ID_ALPHABET = "0123456789abcdef";
const CLIENT_SECRET_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// Mock credentials are display data, but Math.random is a CodeQL finding. Draw
// from crypto.getRandomValues so the generated shapes match what the real token
// endpoint produces without relying on an insecure source.
function randomMockValue(length: number, alphabet: string): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function generateClientId(): string {
  return randomMockValue(32, CLIENT_ID_ALPHABET);
}

function generateClientSecret(): string {
  return randomMockValue(32, CLIENT_SECRET_ALPHABET);
}

/**
 * Mirrors GET /admin/stats: aggregate counts over the mock users, plus the
 * incomplete-profile buckets the overview folds into a "未补全" donut slice (role
 * excludes lecturer/admin; state is njupter-only), matching the backend's
 * UserStats shape (internal/repository/admin_user.go).
 *
 * Soft deletion is a state bit here too, so total / by_role / by_department /
 * no_department and both incomplete buckets count live accounts only, while
 * by_state deliberately keeps every state (is_deleted included) so the console
 * can still show how many accounts were deleted.
 */
function buildUserStats() {
  const all = mockUsers.map((item) => item.profile);

  const byRole: Partial<Record<UserRole, number>> = {};
  const byState: Partial<Record<UserState, number>> = {};
  const byDepartment: Partial<Record<Department, number>> = {};
  const incompleteByRole: Partial<Record<UserRole, number>> = {};
  const incompleteByState: Partial<Record<UserState, number>> = {};
  let total = 0;
  let noDepartment = 0;

  for (const user of all) {
    // by_state spans every state, deleted accounts included.
    byState[user.state] = (byState[user.state] ?? 0) + 1;
    if (user.state === "is_deleted") continue;

    total += 1;
    byRole[user.role] = (byRole[user.role] ?? 0) + 1;

    const department = user.profile?.department;
    if (department) {
      byDepartment[department] = (byDepartment[department] ?? 0) + 1;
    } else {
      noDepartment += 1;
    }

    if (!user.profile_needs_completion) continue;
    if (user.role !== "lecturer" && user.role !== "admin") {
      incompleteByRole[user.role] = (incompleteByRole[user.role] ?? 0) + 1;
    }
    if (user.state === "njupter") {
      incompleteByState[user.state] = (incompleteByState[user.state] ?? 0) + 1;
    }
  }

  return {
    total,
    by_role: byRole,
    by_state: byState,
    by_department: byDepartment,
    no_department: noDepartment,
    incomplete_by_role: incompleteByRole,
    incomplete_by_state: incompleteByState,
  };
}

function filterUsers(params: AdminUserListParams): UserProfileData[] {
  let result = mockUsers.map((item) => item.profile);

  if (params.role) {
    result = result.filter((user) => user.role === params.role);
  }
  if (params.state) {
    result = result.filter((user) => user.state === params.state);
  }
  if (params.department) {
    result = result.filter((user) => user.profile?.department === params.department);
  }
  if (params.student_id) {
    const id = params.student_id.trim();
    result = result.filter((user) => user.student_id === id);
  }
  if (params.keyword) {
    const keyword = params.keyword.trim().toLowerCase();
    result = result.filter(
      (user) =>
        user.name.toLowerCase().includes(keyword) ||
        user.student_id.toLowerCase().includes(keyword) ||
        user.login_email.toLowerCase().includes(keyword),
    );
  }
  if (params.needs_completion !== undefined) {
    result = result.filter(
      (user) => user.profile_needs_completion === params.needs_completion,
    );
  }

  return result;
}

function filterAuditLogs(params: AdminAuditLogListParams): AdminAuditLog[] {
  let result = [...adminMockAuditLogs];

  if (params.user_id !== undefined) {
    result = result.filter((log) => log.user_id === params.user_id);
  }
  if (params.action) {
    result = result.filter((log) => log.action === params.action);
  }
  if (params.resource) {
    result = result.filter((log) => log.resource === params.resource);
  }
  if (params.success !== undefined) {
    result = result.filter((log) => log.success === params.success);
  }
  if (params.start_time) {
    const start = new Date(params.start_time).getTime();
    result = result.filter((log) => new Date(log.created_at).getTime() >= start);
  }
  if (params.end_time) {
    const end = new Date(params.end_time).getTime();
    result = result.filter((log) => new Date(log.created_at).getTime() <= end);
  }

  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const adminHandlers = [
  http.get(`${API_BASE_URL}/admin/stats`, ({ request }) => {
    const auth = authenticatedAdmin(request);
    if (auth.response) return auth.response;

    const recent = [...adminMockAuditLogs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return ok({
      users: buildUserStats(),
      clients: {
        total: adminMockOAuthClients.length,
        active: adminMockOAuthClients.filter((c) => c.is_active).length,
      },
      audit: { recent },
    });
  }),

  http.get(`${API_BASE_URL}/admin/users`, ({ request }) => {
    const auth = authenticatedAdmin(request, true);
    if (auth.response) return auth.response;

    const params = parseSearchParams(request);
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.page_size) || 20));
    const filters: AdminUserListParams = {
      page,
      page_size: pageSize,
      role: normalizeString(params.role) as AdminUserListParams["role"],
      state: normalizeString(params.state) as AdminUserListParams["state"],
      department: normalizeString(params.department) as AdminUserListParams["department"],
      student_id: normalizeString(params.student_id),
      keyword: normalizeString(params.keyword),
      needs_completion:
        params.needs_completion === "true"
          ? true
          : params.needs_completion === "false"
            ? false
            : undefined,
    };

    const users = filterUsers(filters);
    const { items, total } = paginate(users, page, pageSize);
    return ok({ users: items, total, page, page_size: pageSize });
  }),

  http.get(`${API_BASE_URL}/admin/users/:id`, ({ request, params }) => {
    const auth = authenticatedAdmin(request, true);
    if (auth.response) return auth.response;

    const id = Number(params.id);
    const user = mockUsers.find((item) => item.profile.id === id);
    if (!user) return fail(404, 40401, "用户不存在");
    return ok(user.profile);
  }),

  http.put(`${API_BASE_URL}/admin/users/:id`, async ({ request, params }) => {
    const auth = authenticatedAdmin(request);
    if (auth.response) return auth.response;

    const id = Number(params.id);
    const target = mockUsers.find((item) => item.profile.id === id);
    if (!target) return fail(404, 40401, "用户不存在");

    const body = (await request.json()) as AdminUpdateUserRequest;
    const allowedFields: (keyof AdminUpdateUserRequest)[] = [
      "name",
      "phone_number",
      "qq_number",
      "college",
      "major",
      "student_id",
      "login_email",
      "role",
      "state",
      "email_type",
    ];

    let hasUpdate = false;
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "login_email" && typeof body.login_email === "string") {
          target.profile.login_email = body.login_email;
          target.profile.email_type = body.login_email.endsWith("@sast.fun") ? "sast_email" : "njupt_email";
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target.profile as any)[field] = body[field];
        }
        hasUpdate = true;
      }
    }

    if (!hasUpdate) return fail(400, 40000, "没有任何待更新字段");
    target.profile.updated_at = new Date().toISOString();
    return ok({ message: "用户信息更新成功", user: target.profile });
  }),

  http.delete(`${API_BASE_URL}/admin/users/:id`, ({ request, params }) => {
    const auth = authenticatedAdmin(request);
    if (auth.response) return auth.response;

    const id = Number(params.id);
    const target = mockUsers.find((item) => item.profile.id === id);
    if (!target) return fail(404, 40401, "用户不存在");

    target.profile.state = "is_deleted";
    target.profile.updated_at = new Date().toISOString();
    return ok({ message: "用户已注销" });
  }),

  http.put(`${API_BASE_URL}/admin/users/:id/restore`, ({ request, params }) => {
    const auth = authenticatedAdmin(request);
    if (auth.response) return auth.response;

    const id = Number(params.id);
    const target = mockUsers.find((item) => item.profile.id === id);
    if (!target) return fail(404, 40401, "用户不存在");

    target.profile.state = "njupter";
    target.profile.updated_at = new Date().toISOString();
    return ok({ message: "用户已恢复", user: target.profile });
  }),

  http.get(`${API_BASE_URL}/admin/oauth-clients`, ({ request }) => {
    const auth = authenticatedAdmin(request);
    if (auth.response) return auth.response;
    return ok({ clients: adminMockOAuthClients });
  }),

  http.post(`${API_BASE_URL}/admin/oauth-clients`, async ({ request }) => {
    const auth = authenticatedAdmin(request);
    if (auth.response) return auth.response;

    const body = (await request.json()) as AdminCreateOAuthClientRequest;
    const now = new Date().toISOString();
    const newClient: AdminOAuthClient = {
      id: Math.max(0, ...adminMockOAuthClients.map((c) => c.id)) + 1,
      client_id: generateClientId(),
      client_name: body.client_name,
      client_type: body.client_type,
      redirect_uris: body.redirect_uris,
      grant_types: body.grant_types,
      scopes: body.scopes,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    adminMockOAuthClients.push(newClient);
    // The backend answers with a flat DTO (client fields + client_secret for a
    // confidential client), not wrapped in a `client` key; mirror that so the
    // secret dialog and list refresh behave like production.
    const secret = body.client_type === "third_party" ? generateClientSecret() : undefined;
    return ok({ ...newClient, client_secret: secret }, 201);
  }),

  http.put(`${API_BASE_URL}/admin/oauth-clients/:id`, async ({ request, params }) => {
    const auth = authenticatedAdmin(request);
    if (auth.response) return auth.response;

    const id = Number(params.id);
    const client = adminMockOAuthClients.find((item) => item.id === id);
    if (!client) return fail(404, 40402, "OAuth 客户端不存在");

    const body = (await request.json()) as AdminUpdateOAuthClientRequest;
    const rawBody = body as Record<string, unknown>;
    if (
      rawBody.client_id !== undefined ||
      rawBody.client_type !== undefined ||
      rawBody.id !== undefined
    ) {
      return fail(400, 40000, "请求包含不可修改字段");
    }

    const isInternalClient = client.client_id === "sast-link-web";
    if (isInternalClient && body.redirect_uris !== undefined) {
      return fail(403, 40300, "不能修改内置客户端的回调地址");
    }
    if (isInternalClient && body.is_active === false) {
      return fail(403, 40300, "不能停用内置客户端");
    }

    let hasUpdate = false;
    let isDeactivation = false;
    if (body.client_name !== undefined) {
      client.client_name = body.client_name;
      hasUpdate = true;
    }
    if (body.redirect_uris !== undefined) {
      client.redirect_uris = body.redirect_uris;
      hasUpdate = true;
    }
    if (body.is_active !== undefined && body.is_active !== client.is_active) {
      client.is_active = body.is_active;
      hasUpdate = true;
      isDeactivation = !body.is_active;
    }
    if (body.grant_types !== undefined) {
      client.grant_types = body.grant_types;
      hasUpdate = true;
    }
    if (body.scopes !== undefined) {
      client.scopes = body.scopes;
      hasUpdate = true;
    }

    if (!hasUpdate) return fail(400, 40000, "没有任何待更新字段");
    client.updated_at = new Date().toISOString();

    const message = isDeactivation
      ? "客户端信息更新成功，已撤销该客户端的全部 Token"
      : "客户端信息更新成功";
    return ok({ message });
  }),

  http.post(`${API_BASE_URL}/admin/oauth-clients/:id/rotate-secret`, ({ request, params }) => {
    const auth = authenticatedAdmin(request);
    if (auth.response) return auth.response;

    const id = Number(params.id);
    const client = adminMockOAuthClients.find((item) => item.id === id);
    if (!client) return fail(404, 40402, "OAuth 客户端不存在");
    if (client.client_type === "first_party") {
      return fail(400, 40000, "该客户端是公开客户端，没有 client_secret 可轮换");
    }
    return ok({ id, client_secret: generateClientSecret() });
  }),

  http.get(`${API_BASE_URL}/admin/audit-logs`, ({ request }) => {
    const auth = authenticatedAdmin(request);
    if (auth.response) return auth.response;

    const params = parseSearchParams(request);
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.page_size) || 20));
    const filters: AdminAuditLogListParams = {
      page,
      page_size: pageSize,
      user_id: params.user_id ? Number(params.user_id) : undefined,
      action: normalizeString(params.action),
      resource: normalizeString(params.resource),
      success: params.success === "true" ? true : params.success === "false" ? false : undefined,
      start_time: normalizeString(params.start_time),
      end_time: normalizeString(params.end_time),
    };

    const logs = filterAuditLogs(filters);
    const { items, total } = paginate(logs, page, pageSize);
    return ok({ logs: items, total, page, page_size: pageSize });
  }),
];
