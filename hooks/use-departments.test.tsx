import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { SWRConfig } from "swr";

import { server } from "@/mocks/server";
import { API_BASE_URL } from "@/lib/config/public";
import { withCors } from "@/mocks/handlers/respond";
import {
  DEPARTMENT_FALLBACK_OPTIONS,
  useDepartmentOptions,
} from "./use-departments";

function renderFresh() {
  // Fresh cache per test so SWR revalidates against the current handlers.
  return renderHook(() => useDepartmentOptions(), {
    wrapper: ({ children }) => (
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        {children}
      </SWRConfig>
    ),
  });
}

describe("useDepartmentOptions (GET /departments, backend PR #100)", () => {
  it("returns the static fallback while the catalogue is loading", () => {
    const { result } = renderFresh();
    expect(result.current).toEqual(DEPARTMENT_FALLBACK_OPTIONS);
    expect(result.current.map((o) => o.value)).toContain("competition");
  });

  it("adopts the backend catalogue once it resolves", async () => {
    const { result } = renderFresh();
    await waitFor(() =>
      expect(result.current.map((o) => o.value)).toEqual([
        "software",
        "media",
        "electronics",
        "office",
        "liaison",
        "publicity",
        "competition",
      ]),
    );
    expect(result.current.map((o) => o.label)).toContain("赛事部");
  });

  it("keeps the static fallback when the catalogue request fails", async () => {
    let requests = 0;
    server.use(
      http.get(`${API_BASE_URL}/departments`, () => {
        requests += 1;
        return HttpResponse.json({ code: 50000, message: "boom", data: null }, { headers: withCors() });
      }),
    );
    const { result } = renderFresh();
    // Pin that the failing request actually ran and settled — otherwise the
    // assertion below would pass on the synchronous loading fallback without
    // the failure path ever being exercised.
    await waitFor(() => expect(requests).toBe(1));
    expect(result.current).toEqual(DEPARTMENT_FALLBACK_OPTIONS);
    expect(result.current.length).toBe(7);
  });
});
