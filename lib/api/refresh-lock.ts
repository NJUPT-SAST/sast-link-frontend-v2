const REFRESH_LOCK_NAME = "sast-link:auth-refresh";

/**
 * Serializes refresh-token rotations across tabs. The refresh credential is
 * the httpOnly session cookie shared by every tab, and the backend rotates it
 * on each call, so two concurrent refreshes mean one fires an already-revoked
 * token (replay). Holding this lock while a refresh is in flight makes every
 * later caller wait and then send with the freshly rotated cookie instead.
 *
 * Web Locks are scoped to the origin and released automatically when a tab
 * crashes or closes, so a dead holder cannot block the others. Browsers
 * without the API (and jsdom) fall through unlocked — the 40108 retry in the
 * callers remains the backstop there.
 */
export function withRefreshLock<T>(operation: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  if (!locks?.request) {
    return operation();
  }
  return locks.request(REFRESH_LOCK_NAME, { mode: "exclusive" }, operation);
}
