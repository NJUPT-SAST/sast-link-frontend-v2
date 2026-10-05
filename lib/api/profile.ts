import { sessionAccountKey } from "@/lib/api/session-keys";
import { getSession } from "@/lib/token";

/**
 * SWR key for the current user's profile, fingerprinted by the JWT `sub`
 * (account id) so switching accounts invalidates the previous account's
 * cache. The token header is identical for every account, so a token-prefix
 * slice is not a usable fingerprint. Must stay in sync with the key
 * useFetchProfile() registers.
 */
export function profileKey(): string | null {
  const session = getSession();
  if (!session) return null;
  return `user-profile:${sessionAccountKey(session)}`;
}
