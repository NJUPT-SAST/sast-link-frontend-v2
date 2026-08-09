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

export function getSession(): TokenPair | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session: unknown = JSON.parse(raw);
    if (isTokenPair(session)) return session;
  } catch {
    // Invalid and v1 payloads are removed below.
  }

  localStorage.removeItem(SESSION_KEY);
  return null;
}

export function setSession(session: TokenPair): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
