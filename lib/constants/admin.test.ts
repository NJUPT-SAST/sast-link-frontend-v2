import { AUDIT_ACTION_LABELS, AUDIT_RESOURCE_LABELS } from "./admin";

// 从 sast-link-backend-v2 全部审计写入点（internal/service 下各服务 audit / buildAuditEntry /
// auditParams 调用）系统化核对得到的 action 全集。oauth_consent / oauth_grants_* 等
// checkLimit 限流 key 不是审计写入值，已排除。
const BACKEND_AUDIT_ACTIONS = [
  "login",
  "logout",
  "register",
  "register_send_code",
  "register_verify_code",
  "bind_email_send_code",
  "forgot_password_send_code",
  "reset_password",
  "change_password",
  "refresh",
  "logout_device",
  "evict_device",
  "update_profile",
  "upload_avatar",
  "oauth_bind",
  "oauth_unbind",
  "oauth_login",
  "oauth_login_exchange",
  "oauth_authorize",
  "oauth_token",
  "oauth_revoke",
  "oauth_grant_revoke",
  "admin_oauth_client_create",
  "admin_oauth_client_update",
  "admin_oauth_client_rotate_secret",
  "admin_oauth_client_delete",
  "admin_user_update",
  "admin_user_delete",
  "admin_user_restore",
];

const BACKEND_AUDIT_RESOURCES = [
  "user",
  "oauth_client",
  "identity",
  "session",
  "verification_code",
  "oauth",
];

// 前端字典的键必须与后端审计写入值严格一一对应（缺失或多余都会失败）。
describe("audit log enum coverage", () => {
  it("action keys exactly match the backend audit actions", () => {
    expect(Object.keys(AUDIT_ACTION_LABELS).sort()).toEqual(
      [...BACKEND_AUDIT_ACTIONS].sort(),
    );
  });

  it("resource keys exactly match the backend audit resources", () => {
    expect(Object.keys(AUDIT_RESOURCE_LABELS).sort()).toEqual(
      [...BACKEND_AUDIT_RESOURCES].sort(),
    );
  });
});