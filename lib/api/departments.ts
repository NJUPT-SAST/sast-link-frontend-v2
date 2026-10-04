import { apiClient } from "./client";
import type { ApiEnvelope, Department } from "./types";

/** One entry of the public department catalogue (`GET /departments`). */
export interface DepartmentEntry {
  key: Department;
  label: string;
}

export interface DepartmentsData {
  departments: DepartmentEntry[];
}

/**
 * Public department catalogue (backend PR #100): every department key plus its
 * Chinese display name, in console display order. Same source as the backend's
 * `department_enum` — no authentication, no rate limit. This is the canonical
 * place to read the key→label mapping from; DEPARTMENT_LABELS is its static
 * mirror used for synchronous rendering and as the fallback when the request
 * fails (e.g. offline or before the backend ships V021).
 */
export function getDepartments() {
  return apiClient.get<ApiEnvelope<DepartmentsData>>("/departments");
}
