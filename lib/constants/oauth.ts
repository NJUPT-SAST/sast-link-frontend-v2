/** Human-readable descriptions of the scopes this provider can grant.
 *  Shown on the OAuth consent page. Unknown scopes fall back to the raw value. */
const OAUTH_SCOPE_LABELS: Record<string, string> = {
  openid: "身份标识（OpenID）",
  profile: "基本资料（昵称、姓名、签名等）",
  email: "邮箱地址",
};

export function describeOAuthScopes(scopeRaw: string): string[] {
  return scopeRaw
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => OAUTH_SCOPE_LABELS[s] ?? s);
}
