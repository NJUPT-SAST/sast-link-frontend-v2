import type { ClientType, Department, GrantType, Scope, UserRole } from "@/lib/api/types";

export interface AdminNavItem {
  label: string;
  href: string;
  roles: UserRole[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "概览", href: "/admin", roles: ["admin"] },
  { label: "用户管理", href: "/admin/users", roles: ["admin", "lecturer"] },
  // Listing is RequireReader (admin + lecturer) on the backend; approve/reject
  // are admin-only and the review dialog hides those actions for a lecturer.
  { label: "建号申请", href: "/admin/alumni-requests", roles: ["admin", "lecturer"] },
  { label: "OAuth 客户端", href: "/admin/oauth-clients", roles: ["admin"] },
  { label: "审计日志", href: "/admin/audit-logs", roles: ["admin"] },
];

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  first_party: "first_party",
  third_party: "third_party",
};

export const GRANT_TYPE_LABELS: Record<GrantType, string> = {
  authorization_code: "授权码模式",
  refresh_token: "刷新令牌",
};

export const SCOPE_LABELS: Record<Scope, string> = {
  openid: "OpenID",
  profile: "资料",
  email: "邮箱",
  "admin:read": "管理·只读",
  "admin:write": "管理·写入",
  "user:read": "自助·只读",
  "user:write": "自助·写入",
};

/** Renders a scope as `raw · label` for admin surfaces (client list, form chips),
 *  so an administrator can always see the exact scope value behind the label. */
export function formatScope(scope: Scope): string {
  return `${scope} · ${SCOPE_LABELS[scope]}`;
}

export const DEPARTMENT_LABELS: Record<Department, string> = {
  software: "软件研发部",
  media: "多媒体部",
  electronics: "电子部",
  office: "办公室",
  publicity: "科宣部",
  outreach: "外联部",
};

/**
 * 审计日志 action 值 → 中文标签。
 *
 * 键必须与后端写入 audit_logs.action 的字符串一致；列表展示用
 * `AUDIT_ACTION_LABELS[log.action] ?? log.action` 回退原始值，
 * 筛选下拉用 Object.entries(...) 生成选项，因此新增后端动作时必须同步补这里。
 * 已按 sast-link-backend-v2 各服务审计写入点（internal/service/... audit 调用）核对。
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  // 会话/账号
  login: "登录",
  logout: "登出",
  register: "注册",
  register_send_code: "发送注册验证码",
  register_verify_code: "校验注册验证码",
  bind_email_send_code: "发送绑定邮箱验证码",
  forgot_password_send_code: "发送找回密码验证码",
  reset_password: "重置密码",
  change_password: "修改密码",
  refresh: "会话续期",
  // 设备会话
  logout_device: "登出设备",
  evict_device: "吊销设备",
  // 资料与第三方身份
  update_profile: "更新资料",
  upload_avatar: "上传头像",
  oauth_bind: "绑定第三方账号",
  oauth_unbind: "解绑第三方账号",
  oauth_login: "第三方登录",
  oauth_login_exchange: "第三方登录码交换",
  // OAuth 授权流程
  oauth_authorize: "发起授权",
  oauth_token: "兑换令牌",
  oauth_revoke: "撤销令牌",
  oauth_grant_revoke: "撤销授权",
  // 管理操作（后端以具体动作写入，不使用聚合值）
  admin_oauth_client_create: "创建 OAuth 客户端",
  admin_oauth_client_update: "更新 OAuth 客户端",
  admin_oauth_client_rotate_secret: "轮换客户端密钥",
  admin_oauth_client_delete: "删除 OAuth 客户端",
  admin_user_create: "创建用户（管理）",
  admin_user_update: "更新用户（管理）",
  admin_user_delete: "删除用户（管理）",
  admin_user_restore: "恢复用户（管理）",
  // 校友建号工单
  alumni_request_submit: "提交建号申请",
  alumni_request_approve: "通过建号申请",
  alumni_request_reject: "驳回建号申请",
};

/**
 * 审计日志 resource 值 → 中文标签。键需与后端写入 audit_logs.resource 一致。
 */
export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  user: "用户",
  oauth_client: "OAuth 客户端",
  identity: "第三方身份",
  session: "会话",
  verification_code: "验证码",
  oauth: "OAuth",
  alumni_request: "建号申请",
};

/** 建号申请状态 → 中文标签。键与后端 alumni_request_status_enum 一致。 */
export const ALUMNI_REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};

export function formatAdminDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
