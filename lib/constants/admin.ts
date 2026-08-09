import type { ClientType, Department, GrantType, Scope, UserRole } from "@/lib/api/types";

export interface AdminNavItem {
  label: string;
  href: string;
  roles: UserRole[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "概览", href: "/admin", roles: ["admin"] },
  { label: "用户管理", href: "/admin/users", roles: ["admin", "lecturer"] },
  { label: "OAuth 客户端", href: "/admin/oauth-clients", roles: ["admin"] },
  { label: "审计日志", href: "/admin/audit-logs", roles: ["admin"] },
];

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  first_party: "内部应用",
  third_party: "第三方应用",
};

export const GRANT_TYPE_LABELS: Record<GrantType, string> = {
  authorization_code: "授权码模式",
  refresh_token: "刷新令牌",
};

export const SCOPE_LABELS: Record<Scope, string> = {
  openid: "OpenID",
  profile: "资料",
  email: "邮箱",
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  software: "软件研发部",
  media: "多媒体部",
  electronics: "电子部",
  office: "办公室",
  publicity: "科宣部",
  outreach: "外联部",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  register: "注册",
  login: "登录",
  logout: "登出",
  change_password: "修改密码",
  reset_password: "重置密码",
  oauth_bind: "绑定第三方账号",
  oauth_unbind: "解绑第三方账号",
  update_profile: "更新资料",
  upload_avatar: "上传头像",
  admin_action: "管理操作",
};

export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  user: "用户",
  oauth_client: "OAuth 客户端",
  identity: "第三方身份",
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
