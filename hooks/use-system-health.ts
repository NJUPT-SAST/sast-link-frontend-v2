"use client";

import useSWR from "swr";

import { getHealth, mapHealthReadings, type HealthReading } from "@/lib/api/health";

/** Polls /health every 30s and maps it to instrument readings. */
export function useSystemHealth(): HealthReading[] {
  const { data } = useSWR(
    "system-health",
    async () => {
      const response = await getHealth();
      return response.data;
    },
    { refreshInterval: 30_000, shouldRetryOnError: false },
  );
  return mapHealthReadings(data);
}
