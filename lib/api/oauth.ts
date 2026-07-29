import { API_BASE_URL } from "@/lib/config/public";
import type { ApiEnvelope, AuthResultData } from "./types";
import { apiClient } from "./client";

export type OAuthProvider = "github" | "lark";

export function buildOAuthLoginUrl(provider: OAuthProvider) {
  return `${API_BASE_URL}/oauth/${provider}`;
}

export function exchangeLoginCode(code: string, state?: string) {
  return apiClient.post<ApiEnvelope<AuthResultData>>("/oauth/exchange-code", {
    code,
    state,
  });
}
