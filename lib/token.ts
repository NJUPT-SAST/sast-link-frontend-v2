const SESSION_KEY = "Token";

/**
 * The session the tab holds in JS. Only the short-lived access token lives
 * here (memory + sessionStorage); the long-lived refresh token is never
 * persisted in JS-readable storage — it exists only in the backend's httpOnly
 * session cookie (it does appear transiently in auth response bodies, which the
 * frontend discards rather than stores). Refresh and logout therefore send the
 * cookie rather than a stored refresh token.
 */
export interface Session {
  accessToken: string;
  expiresAt: number;
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;

  const session = value as Record<string, unknown>;
  return (
    typeof session.accessToken === "string" &&
    typeof session.expiresAt === "number"
  );
}

export function createSession(accessToken: string, expiresIn: number): Session {
  return {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

// The access token lives in memory for hot paths and in sessionStorage to
// survive a page refresh within the same tab. It is short-lived (1h) and
// unconstrained bearer, so this is a bounded exposure compared to the refresh
// token, which never enters JS — it stays in the httpOnly cookie set by the
// backend. sessionStorage is cleared when the tab closes.
let cachedSession: Session | null = null;

export function getSession(): Session | null {
  // Return a copy, never the module-level reference, so a caller mutating the
  // returned object cannot poison the cache. Refresh replaces via setSession.
  if (cachedSession) {
    // The cache is only ever written by setSession with validated pairs, but a
    // defensive re-check keeps a corrupt entry from being truthy forever and
    // dead-looping the auth bootstrap (getSession() would otherwise report a
    // session that carries no usable token).
    if (isSession(cachedSession)) return { ...cachedSession };
    cachedSession = null;
  }
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session: unknown = JSON.parse(raw);
    if (isSession(session)) {
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

export function setSession(session: Session): void {
  cachedSession = session;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Only persistence is lost; the in-memory copy still serves this tab.
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
