import { HttpResponse } from "msw";

/**
 * Envelope helpers whose responses carry CORS headers.
 *
 * The jest test page (jsdom origin, http://localhost) and the API base URL
 * sit on different origins (e.g. http://localhost:8080). MSW v3 intercepts at
 * the socket level, so mock responses travel back through jsdom's XHR CORS
 * checks — which MSW v2's XHR-layer patch used to skip. The API client sends
 * credentialed requests (withCredentials, cookie sessions), and the CORS
 * spec forbids the wildcard for those: Access-Control-Allow-Origin must echo
 * the concrete origin, paired with Access-Control-Allow-Credentials.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "http://localhost",
  "Access-Control-Allow-Credentials": "true",
} as const;

export function okEnvelope<T>(data: T, status = 200) {
  return HttpResponse.json({ code: 0, message: "ok", data }, {
    status,
    headers: CORS_HEADERS,
  });
}

export function failEnvelope(status: number, code: number, message: string) {
  return HttpResponse.json({ code, message, data: null }, {
    status,
    headers: CORS_HEADERS,
  });
}

/** Merge the CORS headers into handler-specific response headers (e.g.
 *  Set-Cookie) for the HttpResponse calls that cannot route through the
 *  envelope helpers. */
export function withCors(headers: Record<string, string> = {}) {
  return { ...CORS_HEADERS, ...headers };
}
