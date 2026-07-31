import { apiClient } from "./client";
import type { HealthData } from "./types";

/**
 * Probe backend service health (DB + Redis).
 *
 * NOTE: the backend returns this as a **bare JSON object** (healthResponse),
 * not wrapped in the `{ code, message, data }` envelope. Callers read
 * `response.data` directly. See backend internal/health/handler.go.
 */
export function getHealth() {
  return apiClient.get<HealthData>("/health");
}

export interface HealthReading {
  label: string;
  value: string;
  tone: "ok" | "down" | "unknown";
}

/** Map the bare /health payload to instrument readings. `unknown` covers
 *  loading and request failure — the panel shows "--" instead of alarm. */
export function mapHealthReadings(data?: HealthData): HealthReading[] {
  if (!data) {
    return [
      { label: "DB", value: "--", tone: "unknown" },
      { label: "REDIS", value: "--", tone: "unknown" },
      { label: "API", value: "--", tone: "unknown" },
    ];
  }
  return [
    { label: "DB", value: data.db === "ok" ? "OK" : "DOWN", tone: data.db === "ok" ? "ok" : "down" },
    {
      label: "REDIS",
      value: data.redis === "ok" ? "OK" : "DEGRADED",
      tone: data.redis === "ok" ? "ok" : "down",
    },
    { label: "API", value: data.status === "ok" ? "OK" : "ERROR", tone: data.status === "ok" ? "ok" : "down" },
  ];
}
