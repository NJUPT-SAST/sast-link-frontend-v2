import { HttpResponse, http } from "msw";

/**
 * Preflight answers for the cross-origin dev/test topology.
 *
 * The browser (jsdom in tests) talks to the API on another origin
 * (NEXT_PUBLIC_API_BASE_URL, e.g. http://localhost:8080), and XHRs carrying
 * the Authorization header trigger a CORS preflight. MSW v2's XHR-layer
 * interceptor never surfaced those OPTIONS requests; v3's unified HTTP
 * interceptor does — without this handler every preflight lands in the
 * unhandled strategy and the real request dies with an AggregateError.
 * Answering 204 with permissive CORS headers lets the follow-up request
 * reach its actual handler.
 */
export const corsHandlers = [
  http.options("*", () =>
    new HttpResponse(null, {
      status: 204,
      headers: {
        // Echo the concrete jsdom origin: the API client sends credentialed
        // XHRs, and the wildcard ACAO is forbidden for those.
        "Access-Control-Allow-Origin": "http://localhost",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    }),
  ),
];
