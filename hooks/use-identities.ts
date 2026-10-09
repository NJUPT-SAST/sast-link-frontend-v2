"use client";

import useSWR from "swr";

import { getUserIdentities } from "@/lib/api/user";
import { sessionAccountKey } from "@/lib/api/session-keys";
import { getSession } from "@/lib/token";

/** Shared SWR cache for the current user's bound third-party identities. */
export function useIdentities() {
  const { data, error, isValidating, mutate } = useSWR(
    () => {
      const session = getSession();
      if (!session) return null;
      // Key by the JWT sub (account id) so switching accounts invalidates the
      // previous account's identity list instead of rendering stale bindings.
      // The token header is identical for every account, so a token-prefix
      // slice is not a usable fingerprint.
      return `user:identities:${sessionAccountKey(session)}`;
    },
    () =>
      getUserIdentities().then((response) => response.data.data.identities),
  );
  const identities = data ?? [];
  // SWR's own `isLoading` is false on the server (no fetch runs there) but true
  // on the first client render — that would mismatch hydration. `data ===
  // undefined` holds on both, so the loading state is server/client-consistent.
  const isLoading = data === undefined && !error;
  return { identities, isLoading, error, isValidating, mutate };
}
