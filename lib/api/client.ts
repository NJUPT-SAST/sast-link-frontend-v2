import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL } from "@/lib/config/public";
import { clearSession, createSession, getSession, setSession } from "@/lib/token";
import { redirectToLogin } from "./redirect";
import { isConcurrentRefresh } from "./errors";
import type { ApiEnvelope, TokenData } from "./types";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const NO_REFRESH_PATHS = new Set([
  "/auth/refresh",
  "/auth/logout",
  "/user/login",
  "/auth/register",
  "/auth/register/send-code",
  "/auth/register/verify-code",
  "/auth/forgot-password/send-code",
  "/auth/reset-password",
  "/oauth/exchange-code",
  // Unauthenticated by design (the applicant has no account yet), so a 4xx here
  // must never kick off a token refresh.
  "/alumni-requests",
]);

export const apiClient = axios.create({ baseURL: API_BASE_URL });
const refreshClient = axios.create({ baseURL: API_BASE_URL });

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.request.use((config) => {
  const accessToken = getSession()?.accessToken;
  if (accessToken) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

async function refreshAccessToken(): Promise<string> {
  // The refresh token lives only in the httpOnly session cookie, so this
  // carries it with an empty body and the response rotates it (re-setting the
  // cookie) and returns a fresh access token. No stored refresh token exists.
  const attempt = () =>
    refreshClient.post<ApiEnvelope<TokenData>>("/auth/refresh", {}, { timeout: 10_000 });

  let response: AxiosResponse<ApiEnvelope<TokenData>>;
  try {
    response = await attempt();
  } catch (error) {
    // 40108 = a multi-tab cold-start race: the winner rotated the cookie's
    // refresh token and this call lost on the revoked token within the 30s
    // grace window. Retry once — the shared cookie jar now carries the winner's
    // token. A plain 401 (dead session) or a transient failure ends here.
    if (isConcurrentRefresh(error)) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      response = await attempt();
    } else {
      throw error;
    }
  }

  const data = response.data.data;
  const nextSession = createSession(data.access_token, data.expires_in);
  setSession(nextSession);
  return nextSession.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const session = getSession();
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      !session ||
      NO_REFRESH_PATHS.has(config.url ?? "")
    ) {
      throw error;
    }

    config._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    try {
      const accessToken = await refreshPromise;
      config.headers = AxiosHeaders.from(config.headers);
      config.headers.set("Authorization", `Bearer ${accessToken}`);
      return apiClient(config);
    } catch (refreshError) {
      // Only a refresh that ends in a definitive 401 means the session is dead
      // (the cookie's family was revoked/expired) — that alone clears the
      // session and bounces to login. A transient network/5xx/timeout failure
      // must not destroy the session or hard-navigate; the caller sees the
      // error and a later request can recover through the cookie again.
      if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
        clearSession();
        redirectToLogin();
      }
      throw refreshError;
    }
  },
);
