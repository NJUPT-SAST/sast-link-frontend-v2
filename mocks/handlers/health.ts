import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/lib/config/public";
import { withCors } from "./respond";

/**
 * GET /health returns a **bare** healthResponse (no envelope). Mirrors
 * backend internal/health/handler.go.
 */
export const healthHandlers = [
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({ status: "ok", db: "ok", redis: "ok" }, { headers: withCors() });
  }),
];
