/**
 * sessionStorage can throw in private modes, sandboxed webviews, and under
 * quota limits. lib/token.ts guards every access for this reason; auth flows
 * that keep step state in sessionStorage must not crash (or freeze mid-click)
 * when the store is unavailable. These wrappers degrade to the in-memory state
 * the caller already holds — persistence is a convenience, not a requirement.
 */
export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Only refresh persistence is lost; the caller's in-memory state wins.
    }
  },
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore — there is nothing to remove if the store is unreachable.
    }
  },
};
