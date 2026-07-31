import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL } from "@/lib/config/public";
import { clearSession, getSession, setSession } from "@/lib/token";
import { redirectToLogin } from "./redirect";
import type { ApiEnvelope, TokenData } from "./types";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const NO_REFRESH_PATHS = new Set([
  "/auth/refresh",
  "/user/login",
  "/auth/register",
  "/auth/register/send-code",
  "/auth/register/verify-code",
  "/auth/forgot-password/send-code",
  "/auth/reset-password",
  "/oauth/exchange-code",
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
  const session = getSession();
  if (!session?.refreshToken) throw new Error("Missing refresh token");

  const response = await refreshClient.post<ApiEnvelope<TokenData>>(
    "/auth/refresh",
    { refresh_token: session.refreshToken },
  );
  const data = response.data.data;
  const nextSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
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
      !session?.refreshToken ||
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
      clearSession();
      // Session is unrecoverable - bounce to login instead of stranding the
      // user on a page that will only keep 401-ing.
      redirectToLogin();
      throw refreshError;
    }
  },
);
