const SESSION_KEY = "Token";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function isTokenPair(value: unknown): value is TokenPair {
  if (!value || typeof value !== "object") return false;

  const session = value as Record<string, unknown>;
  return (
    typeof session.accessToken === "string" &&
    typeof session.refreshToken === "string" &&
    typeof session.expiresAt === "number"
  );
}

export function createSession(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
): TokenPair {
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

// The session lives in memory for hot paths and in sessionStorage to survive a
// page refresh within the same tab. sessionStorage is cleared when the tab closes —
// narrower persistence than the old localStorage, so a stolen token's shelf life
// ends with the tab rather than lingering across the whole browser session. A
// token is still readable by script on the page (the accepted trade-off short of
// httpOnly cookies), but it no longer sits in a cross-tab store.
let cachedSession: TokenPair | null = null;

export function getSession(): TokenPair | null {
  // Return a copy, never the module-level reference, so a caller mutating the
  // returned object cannot poison the cache. Refresh replaces via setSession.
  if (cachedSession) return { ...cachedSession };
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session: unknown = JSON.parse(raw);
    if (isTokenPair(session)) {
      cachedSession = session;
      // Cold path (page refresh): this is the first read after the module
      // cache was cleared, so `session` is also the cache entry. Return a copy
      // so a caller mutating the read cannot poison the just-seeded cache.
      return { ...session };
    }
  } catch {
    // Corrupt payloads fall through to a clear.
  }

  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage can be unavailable in private modes; the in-memory copy still works.
  }
  return null;
}

export function setSession(session: TokenPair): void {
  cachedSession = session;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Only refresh persistence is lost; the in-memory copy still serves this tab.
  }
}

export function clearSession(): void {
  cachedSession = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore: storage may be unavailable.
  }
}
