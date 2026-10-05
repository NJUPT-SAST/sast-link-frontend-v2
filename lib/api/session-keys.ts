import { mutate } from "swr";

import type { Session } from "@/lib/token";

function base64UrlToBase64(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  return normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
}

/**
 * Fingerprint the account behind a session for SWR cache keys. The access
 * token is an EdDSA JWT whose header bytes are identical for every account
 * (`eyJhbGciOiJFZERT…`), so a token-prefix slice is a constant across
 * accounts — read the `sub` claim (the account id) instead. A token that does
 * not parse as a JWT with a `sub` falls back to the full token string, so
 * distinct accounts still get distinct keys.
 */
export function sessionAccountKey(session: Session): string {
  const token = session.accessToken;
  try {
    const segments = token.split(".");
    if (segments.length !== 3) return token;
    const bytes = Uint8Array.from(atob(base64UrlToBase64(segments[1])), (char) =>
      char.charCodeAt(0),
    );
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload || typeof payload !== "object") return token;
    const sub = (payload as { sub?: unknown }).sub;
    if (typeof sub === "string" && sub.length > 0) return sub;
    if (typeof sub === "number") return String(sub);
    return token;
  } catch {
    return token;
  }
}

/**
 * Drop every entry in SWR's in-memory cache (identities, OAuth grants, badge,
 * …). Login/logout are client-side navigations, so the cache survives across
 * accounts; call this when the signed-in account changes so the first render
 * after the switch cannot flash the previous account's data. providers.tsx
 * uses SWR's default global cache, so the global `mutate` reaches every
 * useSWR call in the app.
 */
export function clearAccountDataCache(): Promise<unknown> {
  return mutate(() => true, undefined, { revalidate: false });
}
