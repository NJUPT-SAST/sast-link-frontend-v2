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
