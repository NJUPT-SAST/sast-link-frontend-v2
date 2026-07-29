"use client";

import useSWR from "swr";

import { getUserIdentities } from "@/lib/api/user";

/** Shared SWR cache for the current user's bound third-party identities. */
export function useIdentities() {
  const { data: identities = [], mutate } = useSWR("user:identities", () =>
    getUserIdentities().then((response) => response.data.data.identities),
  );
  return { identities, mutate };
}
