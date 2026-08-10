import { getSession } from "@/lib/token";

/**
 * SWR key for the current user's profile, fingerprinted by session so switching
 * accounts invalidates the previous account's cache. Must stay in sync with the
 * key useFetchProfile() registers.
 */
export function profileKey(): string | null {
  const session = getSession();
  if (!session) return null;
  return `user-profile:${session.accessToken.slice(0, 16)}`;
}
