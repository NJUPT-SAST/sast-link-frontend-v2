/** In-memory badge state for the MSW mock. One active badge per session,
 * mirroring the backend's one-row-per-user contract; the key is a stable
 * fake so preview URLs survive across revalidations. */

export const badgeState = {
  enabled: false,
  key: "mock-badge-key-000000000000000000000000",
  enabledAt: null as string | null,
};

export function resetBadgeState() {
  badgeState.enabled = false;
  badgeState.enabledAt = null;
}
