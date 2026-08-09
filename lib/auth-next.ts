const NEXT_KEY = "sast:auth-next";

/** Returns true when the value is a same-site absolute path, guarding against
 *  open-redirect style values ("//evil.com", "https://evil.com"). */
function safeNext(next: string | null): string | null {
  if (!next) return null;
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return null;
}

/** Remember where to send the user after they finish logging in. */
export function stashAuthNext(url: string): void {
  if (typeof window === "undefined") return;
  const safe = safeNext(url);
  if (safe) sessionStorage.setItem(NEXT_KEY, safe);
}

/** Read and clear the pending post-login destination. */
export function consumeAuthNext(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const next = safeNext(sessionStorage.getItem(NEXT_KEY));
  sessionStorage.removeItem(NEXT_KEY);
  return next ?? fallback;
}
