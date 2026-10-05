"use client";

import useSWR from "swr";

import { getBadgeStatus } from "@/lib/api/badge";
import { sessionAccountKey } from "@/lib/api/session-keys";
import { getSession } from "@/lib/token";

/** Shared SWR cache for the current user's badge sharing state. */
export function useBadge() {
  const { data, mutate } = useSWR(
    () => {
      const session = getSession();
      if (!session) return null;
      // Key by the JWT sub (account id) so switching accounts invalidates the
      // previous account's badge state instead of rendering it. The token
      // header is identical for every account, so a token-prefix slice is not
      // a usable fingerprint.
      return `user:badge:${sessionAccountKey(session)}`;
    },
    () => getBadgeStatus().then((response) => response.data.data),
  );
  // SWR's own `isLoading` is false on the server but true on the first client
  // render — that would mismatch hydration. `data === undefined` holds on
  // both, so the loading state is server/client-consistent.
  const isLoading = data === undefined;
  return { badge: data, isLoading, mutate };
}
