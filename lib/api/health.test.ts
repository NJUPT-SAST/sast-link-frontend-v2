jest.mock("./client", () => ({
  apiClient: { get: jest.fn() },
}));

import { apiClient } from "./client";
import { getHealth, mapHealthReadings } from "./health";

describe("lib/api/health", () => {
  beforeEach(() => jest.clearAllMocks());

  it("probes the backend health endpoint", () => {
    getHealth();
    expect(apiClient.get).toHaveBeenCalledWith("/health");
  });
});

describe("mapHealthReadings", () => {
  it("returns unknown placeholders without data", () => {
    expect(mapHealthReadings(undefined)).toEqual([
      { label: "DB", value: "--", tone: "unknown" },
      { label: "REDIS", value: "--", tone: "unknown" },
      { label: "API", value: "--", tone: "unknown" },
    ]);
  });

  it("maps a healthy payload", () => {
    expect(mapHealthReadings({ status: "ok", db: "ok", redis: "ok" })).toEqual([
      { label: "DB", value: "OK", tone: "ok" },
      { label: "REDIS", value: "OK", tone: "ok" },
      { label: "API", value: "OK", tone: "ok" },
    ]);
  });

  it("flags degraded redis and error status", () => {
    const readings = mapHealthReadings({ status: "error", db: "error", redis: "degraded" });
    expect(readings[0]).toEqual({ label: "DB", value: "DOWN", tone: "down" });
    expect(readings[1]).toEqual({ label: "REDIS", value: "DEGRADED", tone: "down" });
    expect(readings[2]).toEqual({ label: "API", value: "ERROR", tone: "down" });
  });
});
