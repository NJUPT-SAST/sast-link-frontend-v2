"use client";

import useSWR from "swr";

import { getAdminOAuthClients } from "@/lib/api/admin";
import { getSession } from "@/lib/token";

export const ADMIN_OAUTH_CLIENTS_KEY = "admin-oauth-clients";

export function useAdminOAuthClients() {
  return useSWR(
    () => (getSession() ? ADMIN_OAUTH_CLIENTS_KEY : null),
    async () => {
      const response = await getAdminOAuthClients();
      return response.data.data.clients;
    },
    { revalidateOnFocus: false },
  );
}
