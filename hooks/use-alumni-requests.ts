"use client";

import useSWR from "swr";

import type { AlumniRequestListParams } from "@/lib/api/types";
import { getAlumniRequests } from "@/lib/api/alumni";
import { getSession } from "@/lib/token";

export function buildAlumniRequestsKey(params?: AlumniRequestListParams) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));
  if (params?.status) search.set("status", params.status);
  if (params?.keyword) search.set("keyword", params.keyword);
  if (params?.notified !== undefined) search.set("notified", String(params.notified));
  return `admin-alumni-requests?${search.toString()}`;
}

export function useAlumniRequests(params?: AlumniRequestListParams) {
  return useSWR(
    () => (getSession() ? buildAlumniRequestsKey(params) : null),
    async () => {
      const response = await getAlumniRequests(params);
      return response.data.data;
    },
    { revalidateOnFocus: false },
  );
}
