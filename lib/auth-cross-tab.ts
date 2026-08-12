const INVALIDATED_KEY = "sast:auth-invalidated";

/**
 * Cross-tab session revocation. localStorage is shared across tabs and fires
 * a `storage` event in every other tab, so it is the cheapest channel to tell
 * a tab that its session was revoked elsewhere (logout / password change). The
 * value is just a timestamp; only the key matters.
 */

/** Mark this browser's session as revoked so other open tabs drop their local
 *  copy instead of showing a dead session for the rest of the access token's
 *  life. Call after the server-side revoke has committed. */
export function markAuthInvalidated(): void {
  try {
    localStorage.setItem(INVALIDATED_KEY, String(Date.now()));
  } catch {
    // Storage unavailable — the other tabs self-heal on their next 401 or
    // bootstrap anyway.
  }
}

/** Subscribe to a session revocation that happened in another tab. Returns an
 *  unsubscribe function. */
export function onAuthInvalidated(callback: () => void): () => void {
  const handler = (event: StorageEvent) => {
    // Ignore same-name writes to sessionStorage (other frames of this tab) and
    // any removal — only a localStorage write of the marker is a revocation.
    if (
      event.storageArea === localStorage &&
      event.key === INVALIDATED_KEY &&
      event.newValue !== null
    ) {
      callback();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
