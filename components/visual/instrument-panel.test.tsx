import { render, screen } from "@testing-library/react";

import { InstrumentPanel } from "./instrument-panel";

jest.mock("@/hooks/use-system-health", () => ({
  useSystemHealth: () => [
    { label: "DB", value: "OK", tone: "ok" },
    { label: "REDIS", value: "DEGRADED", tone: "down" },
    { label: "API", value: "OK", tone: "ok" },
  ],
}));

describe("InstrumentPanel", () => {
  it("renders the clock region and health readings", () => {
    render(<InstrumentPanel />);
    expect(screen.getByRole("region", { name: "系统状态" })).toBeInTheDocument();
    expect(screen.getByText("DB")).toBeInTheDocument();
    expect(screen.getByText("REDIS")).toBeInTheDocument();
    expect(screen.getByText("DEGRADED")).toBeInTheDocument();
    expect(screen.getAllByText("OK")).toHaveLength(2);
  });
});
