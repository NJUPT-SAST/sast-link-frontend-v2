"use client";

import useSWR from "swr";

import { getBadgeStatus } from "@/lib/api/badge";
import { getSession } from "@/lib/token";

/** Shared SWR cache for the current user's badge sharing state. */
export function useBadge() {
  const { data, mutate } = useSWR(
    () => {
      const session = getSession();
      if (!session) return null;
      return `user:badge:${session.accessToken.slice(0, 16)}`;
    },
    () => getBadgeStatus().then((response) => response.data.data),
  );
  // SWR's own `isLoading` is false on the server but true on the first client
  // render — that would mismatch hydration. `data === undefined` holds on
  // both, so the loading state is server/client-consistent.
  const isLoading = data === undefined;
  return { badge: data, isLoading, mutate };
}
