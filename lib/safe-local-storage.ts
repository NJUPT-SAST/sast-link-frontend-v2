/**
 * localStorage can throw in private modes, sandboxed webviews, and under quota
 * limits, exactly like sessionStorage. Remembering the last-used login account
 * is a convenience, not a requirement: if the store is unavailable the login
 * form just starts blank. These wrappers degrade to null / no-op so the auth
 * flow never crashes on a store fault.
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Only the remembered-account convenience is lost.
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore — there is nothing to remove if the store is unreachable.
    }
  },
};
