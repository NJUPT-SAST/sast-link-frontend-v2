import type { Scope } from "@/lib/api/types";

/** Human-readable descriptions of the scopes this provider can grant, keyed by
 *  scope. Shown on the OAuth consent page and the authorized-apps list. Unknown
 *  scopes fall back to the raw value. */
const OAUTH_SCOPE_DESCRIPTIONS: Partial<Record<Scope, string>> = {
  openid: "身份标识（OpenID）",
  profile: "基本资料（昵称、姓名、签名等）",
  email: "邮箱地址",
  "admin:read": "管理后台只读：查看用户目录、OAuth 客户端与审计日志（仅当你是 Link 管理员时生效）",
  "admin:write": "管理后台写入：修改角色、封禁/恢复用户、管理 OAuth 客户端（仅当你是 Link 管理员时生效）",
  "user:read": "读取你的资料：姓名、学号、手机号、学院、专业、QQ 等",
  "user:write": "修改你的资料、头像、身份绑定与密码",
};

/** Maps a space-delimited scope claim to one display string per scope, always
 *  prefixed with the raw scope value so a user can match what was granted. */
export function describeOAuthScopes(scopeRaw: string): string[] {
  return scopeRaw
    .split(/\s+/)
    .filter(Boolean)
    .map((scope) => {
      const description = OAUTH_SCOPE_DESCRIPTIONS[scope as Scope];
      return description ? `${scope} · ${description}` : scope;
    });
}
