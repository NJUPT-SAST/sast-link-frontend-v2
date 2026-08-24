const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = configuredApiBaseUrl || "http://localhost:8080";

/** Third-party OAuth client ids / bind redirects. Public by design — the
 * provider hands them to the browser during authorization. */
export const FEISHU_CLIENT_ID = process.env.NEXT_PUBLIC_FEISHU_CLIENT_ID;
export const FEISHU_BIND_REDIRECT_URI =
  process.env.NEXT_PUBLIC_FEISHU_BIND_REDIRECT_URI;
export const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
export const GITHUB_BIND_REDIRECT_URI =
  process.env.NEXT_PUBLIC_GITHUB_BIND_REDIRECT_URI;

/** Cloudflare Turnstile site key for the alumni request form. Public by design
 *  (the widget renders it in the browser).
 *
 *  Absent means the alumni channel is off for this deployment: the backend
 *  verifies the token unconditionally and refuses the endpoint when it has no
 *  secret, so the frontend hides the entry point rather than offering a form that
 *  is guaranteed to fail. */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined;
