"use client";

import useSWR from "swr";

import type { AdminUserListParams } from "@/lib/api/types";
import { getAdminUser, getAdminUsers } from "@/lib/api/admin";
import { getSession } from "@/lib/token";

const ADMIN_USERS_KEY = "admin-users";

export function buildAdminUsersKey(params?: AdminUserListParams) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));
  if (params?.role) search.set("role", params.role);
  if (params?.state) search.set("state", params.state);
  if (params?.department) search.set("department", params.department);
  if (params?.student_id) search.set("student_id", params.student_id);
  if (params?.keyword) search.set("keyword", params.keyword);
  return `${ADMIN_USERS_KEY}?${search.toString()}`;
}

export function useAdminUsers(params?: AdminUserListParams) {
  return useSWR(
    () => (getSession() ? buildAdminUsersKey(params) : null),
    async () => {
      const response = await getAdminUsers(params);
      return response.data.data;
    },
    { revalidateOnFocus: false },
  );
}

export function buildAdminUserKey(id: number) {
  return `admin-user:${id}`;
}

export function useAdminUser(id: number | null) {
  return useSWR(
    () => (getSession() && id !== null ? buildAdminUserKey(id) : null),
    async () => {
      const response = await getAdminUser(id as number);
      return response.data.data;
    },
    { revalidateOnFocus: false },
  );
}
