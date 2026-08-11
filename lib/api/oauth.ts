import * as publicConfig from "@/lib/config/public";
import { safeSessionStorage } from "@/lib/safe-session-storage";
import type { ApiEnvelope, AuthResultData } from "./types";
import { apiClient } from "./client";

export type OAuthProvider = "github" | "lark";

export function buildOAuthLoginUrl(provider: OAuthProvider) {
  return `${publicConfig.API_BASE_URL}/oauth/${provider}`;
}

export function exchangeLoginCode(code: string) {
  return apiClient.post<ApiEnvelope<AuthResultData>>("/oauth/exchange-code", {
    code,
  });
}

/** Records the user's decision on a pending authorization request and returns
 *  the target redirect_uri (with the one-time authorization code) to follow. */
export function consentAuthorize(requestId: string, approve: boolean) {
  return apiClient.post<ApiEnvelope<{ redirect_uri: string }>>(
    "/oauth/authorize/consent",
    { request_id: requestId, approve },
  );
}

/** Verified client metadata for one pending authorization request. */
export interface OAuthConsentInfo {
  client_name: string;
  scopes: string[];
  expires_in: number;
}

/** Fetches a pending request's verified client metadata from the backend. The
 *  consent page renders these instead of any URL-supplied value, so a crafted
 *  link cannot spoof which application is asking. */
export function getConsentInfo(requestId: string) {
  return apiClient.get<ApiEnvelope<OAuthConsentInfo>>("/oauth/authorize/consent", {
    params: { request_id: requestId },
  });
}

/** One application the current user has authorized via the consent screen. */
export interface OAuthGrant {
  client_id: number;
  client_key: string;
  client_name: string;
  client_type: string;
  redirect_uris: string[];
  is_active: boolean | null;
  scopes: string[];
  last_authorized_at: string;
}

/** Lists the applications the current user has authorized. */
export function getGrants() {
  return apiClient.get<ApiEnvelope<{ grants: OAuthGrant[] }>>("/oauth/grants");
}

/** Revokes one application's access for the current user. */
export function revokeGrant(clientId: number) {
  return apiClient.delete<ApiEnvelope<{ message: string }>>(
    `/oauth/grants/${clientId}`,
  );
}

/**
 * Bind-leg OAuth settings. The bind callback is a frontend route (not a backend
 * callback), so the authorize URL is assembled here from public values: the
 * client_id is handed to the browser by design, and the redirect_uri is the
 * frontend page the provider bounces back to.
 */
function bindSettings(provider: OAuthProvider): {
  clientId?: string;
  redirectUri?: string;
} {
  if (provider === "lark") {
    return {
      clientId: publicConfig.FEISHU_CLIENT_ID,
      redirectUri: publicConfig.FEISHU_BIND_REDIRECT_URI,
    };
  }
  return {
    clientId: publicConfig.GITHUB_CLIENT_ID,
    redirectUri: publicConfig.GITHUB_BIND_REDIRECT_URI,
  };
}

/** sessionStorage key holding the pending bind `state` for one provider. */
const BIND_STATE_KEY = "sast:oauth-bind:state";

export function buildBindOAuthUrl(provider: OAuthProvider): string | null {
  const { clientId, redirectUri } = bindSettings(provider);
  if (!clientId || !redirectUri) return null;

  const state = crypto.getRandomValues(new Uint8Array(16)).join("");
  safeSessionStorage.setItem(`${BIND_STATE_KEY}:${provider}`, state);

  const encodedRedirect = encodeURIComponent(redirectUri);
  if (provider === "lark") {
    return `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${clientId}&redirect_uri=${encodedRedirect}&state=${state}`;
  }
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodedRedirect}&scope=read%3Auser&state=${state}&allow_signup=false&response_type=code`;
}

/**
 * Verify the callback `state` against the one stored when the authorize URL was
 * built, then consume it (a bind attempt happens once). Defends against CSRF on
 * the bind callback.
 */
export function consumeBindState(provider: OAuthProvider, state: string | null): boolean {
  const key = `${BIND_STATE_KEY}:${provider}`;
  const stored = safeSessionStorage.getItem(key);
  safeSessionStorage.removeItem(key);
  return Boolean(state) && stored === state;
}
