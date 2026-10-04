"use client";

import useSWR from "swr";

import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { getDepartments } from "@/lib/api/departments";
import type { Department } from "@/lib/api/types";

const DEPARTMENTS_KEY = "departments";

export interface DepartmentOption {
  value: Department;
  label: string;
}

/** Static fallback built from DEPARTMENT_LABELS — used while the catalogue
 *  request is in flight and whenever it fails. The backend promises the
 *  catalogue stays in sync with the enum, so a missing key here renders as the
 *  raw value at display sites and is simply absent from pickers. */
export const DEPARTMENT_FALLBACK_OPTIONS: DepartmentOption[] = (
  Object.keys(DEPARTMENT_LABELS) as Department[]
).map((key) => ({ value: key, label: DEPARTMENT_LABELS[key] }));

/**
 * Department picker options sourced from the public `GET /departments`
 * catalogue (backend PR #100). Falls back to the static DEPARTMENT_LABELS
 * mirror on error or while loading, so pickers always render a usable list.
 * Public endpoint — no session required.
 */
export function useDepartmentOptions(): DepartmentOption[] {
  const { data } = useSWR(
    DEPARTMENTS_KEY,
    async () => {
      const response = await getDepartments();
      return response.data.data;
    },
    { revalidateOnFocus: false },
  );

  if (!data?.departments?.length) return DEPARTMENT_FALLBACK_OPTIONS;
  return data.departments.map((entry) => ({
    value: entry.key,
    label: entry.label,
  }));
}
