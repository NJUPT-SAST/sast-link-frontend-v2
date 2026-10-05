import * as publicConfig from "@/lib/config/public";
import { safeSessionStorage } from "@/lib/safe-session-storage";
import type { ApiEnvelope, AuthResultData } from "./types";
import { apiClient } from "./client";
import { redirectTo } from "./redirect";

export type OAuthProvider = "github" | "lark";

/** sessionStorage slot holding the PKCE verifier for the OAuth login this tab
 *  has in flight (backend PR #111, RFC 7636). One slot is race-free: a tab can
 *  have only one provider round trip in flight — a second initiation replaces
 *  the first (whose login_code simply expires unredeemable), and cross-tab
 *  traffic is isolated by sessionStorage itself. */
const PKCE_VERIFIER_KEY = "sast:oauth-pkce-verifier";

/** RFC 7636 unreserved charset [A-Za-z0-9-._~]; 64 chars is comfortably inside
 *  the allowed 43..128 band. */
const PKCE_VERIFIER_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
const PKCE_VERIFIER_LENGTH = 64;

function createPKCEVerifier(): string {
  // crypto.getRandomValues exists in every supported browser and in jsdom.
  const bytes = new Uint8Array(PKCE_VERIFIER_LENGTH);
  crypto.getRandomValues(bytes);
  let verifier = "";
  for (const byte of bytes) {
    verifier += PKCE_VERIFIER_ALPHABET[byte % PKCE_VERIFIER_ALPHABET.length];
  }
  return verifier;
}

/** base64url(SHA-256(verifier)) — the S256 code challenge. Exported for the
 *  RFC 7636 appendix-B spec-vector test. */
export async function pkceChallengeS256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  let binary = "";
  for (const byte of new Uint8Array(digest)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Create and store a fresh verifier, returning its S256 challenge. Used by
 *  both initiation legs — the authorize-page redirect and the Feishu embedded
 *  page's app-code post — so the login_code either leg buys is bound to this
 *  tab's verifier and cannot be redeemed from anywhere the URL leaks. */
export async function stagePKCEVerifier(): Promise<string> {
  const verifier = createPKCEVerifier();
  safeSessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  return pkceChallengeS256(verifier);
}

/** Peek the staged verifier without clearing it: a transient exchange
 *  failure (network error before the backend consumed the code) must be
 *  retryable, and the retry needs the same verifier. */
export function readPKCEVerifier(): string {
  return safeSessionStorage.getItem(PKCE_VERIFIER_KEY) ?? "";
}

/** Drop the staged verifier once its login_code is definitively redeemed or
 *  burned — the slot is single-use by design. */
export function clearPKCEVerifier(): void {
  safeSessionStorage.removeItem(PKCE_VERIFIER_KEY);
}

/** Start a provider login from a click: stage the verifier, stamp this tab as
 *  the initiator (the callback's stop-page guard), and leave for the backend's
 *  authorize URL with the challenge — never the verifier — in the query. The
 *  URL must be built at click time, so callers wire this into onClick rather
 *  than a pre-rendered href. A same-frame double click is a no-op: the second
 *  run would stage a second verifier while the first redirect is already
 *  leaving, mismatching the URL's challenge against the stored verifier.
 *  (Storage-disabled browsers lose login here by design — the backend refuses
 *  a verifier-less exchange anyway, so the stamp/verifier can only live in
 *  sessionStorage.) */
let launchInFlight = false;
export async function beginOAuthLogin(provider: OAuthProvider): Promise<void> {
  if (launchInFlight) return;
  launchInFlight = true;
  try {
    const challenge = await stagePKCEVerifier();
    markOAuthLoginInitiated(provider);
    redirectTo(
      `${publicConfig.API_BASE_URL}/oauth/${provider}` +
        `?code_challenge=${encodeURIComponent(challenge)}` +
        `&code_challenge_method=S256`,
    );
  } finally {
    launchInFlight = false;
  }
}

export function exchangeLoginCode(code: string, codeVerifier: string) {
  return apiClient.post<ApiEnvelope<AuthResultData>>("/oauth/exchange-code", {
    code,
    code_verifier: codeVerifier,
  });
}

/** Response payload of the Feishu in-client login-free entrance (backend PR
 *  #105, `POST /oauth/lark/app-code`). Its fields mirror the authorize-page
 *  callback redirect's query parameters one for one: bound=true carries the
 *  one-time login_code (redeem via exchangeLoginCode), bound=false carries the
 *  registration double-binding pair plus display hints for the register step. */
export interface LarkAppCodeLoginData {
  bound: boolean;
  login_code?: string;
  registration_state?: string;
  oauth_state?: string;
  provider: string;
  name?: string;
  avatar?: string;
}

/** Redeem the JSAPI pre-authorization code obtained inside the Feishu client
 *  (tt.requestAccess / tt.requestAuthCode). Same identity gate and the same
 *  login/register split as the authorize-page callback. The PKCE challenge
 *  (from stagePKCEVerifier) is required: the login_code this buys is bound to
 *  the tab's verifier. */
export function larkAppCodeLogin(code: string, codeChallenge: string) {
  return apiClient.post<ApiEnvelope<LarkAppCodeLoginData>>("/oauth/lark/app-code", {
    code,
    code_challenge: codeChallenge,
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

/** sessionStorage key holding the time this tab initiated one provider's
 *  login redirect. The callback `?code=` (login_code) is a pure bearer
 *  one-time code with no browser binding — anyone holding the URL can redeem
 *  it — so the callback page only auto-redeems when the redirect was started
 *  from this very tab. That confines the "auto-redeem" carrier to a browser
 *  whose own tab jumped, cutting off link-drop / login-CSRF payloads that
 *  hand victims a prebaked callback URL. sessionStorage (per-tab) survives
 *  the cross-origin provider round trip within the tab.
 *
 *  Backend-side browser binding for exchange-code is still the real fix; this
 *  is a frontend mitigation until it ships. */
const LOGIN_INITIATED_KEY = "sast:oauth-login-init";
/** Backend OAuth state TTL is 10 minutes; the window keeps a margin so a slow
 *  consent round trip is not mistaken for a link from elsewhere. */
const LOGIN_INITIATED_TTL_MS = 15 * 60 * 1000;

const OAUTH_PROVIDERS: readonly OAuthProvider[] = ["github", "lark"];

/** Stamp the moment this tab is about to leave for a provider login page.
 *  Must be called at click time, not on page load, so only genuinely
 *  user-initiated jumps arm the callback guard. */
export function markOAuthLoginInitiated(provider: OAuthProvider): void {
  safeSessionStorage.setItem(
    `${LOGIN_INITIATED_KEY}:${provider}`,
    String(Date.now()),
  );
}

/** Whether any provider's login redirect was initiated from this tab recently
 *  enough for its callback to be worth auto-redeeming. A pure read — no key
 *  removal — because the callers run it during render; expired stamps are
 *  simply ignored (the next initiation overwrites its provider's slot and
 *  the tab close clears the rest). */
export function hasRecentOAuthLoginInitiation(): boolean {
  const now = Date.now();
  for (const provider of OAUTH_PROVIDERS) {
    const raw = safeSessionStorage.getItem(`${LOGIN_INITIATED_KEY}:${provider}`);
    if (raw === null) continue;
    const stampedAt = Number(raw);
    if (Number.isFinite(stampedAt) && now - stampedAt < LOGIN_INITIATED_TTL_MS) {
      return true;
    }
  }
  return false;
}

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
