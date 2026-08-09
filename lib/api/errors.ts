import type { AxiosError } from "axios";

import type { ApiFailure } from "./types";

interface OAuthErrorBody {
  error: string;
  error_description?: string;
}

function parseRetryAfter(value: unknown): number | undefined {
  if (typeof value === "string") {
    const seconds = Number.parseInt(value, 10);
    if (!Number.isNaN(seconds)) return seconds;
  }
  return undefined;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly status?: number,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(error: unknown): ApiError {
  if (error === null || error === undefined) {
    return new ApiError("网络错误", 0);
  }

  const axiosError = error as AxiosError<ApiFailure | OAuthErrorBody>;
  const body = axiosError.response?.data;
  const status = axiosError.response?.status;
  const retryAfter = parseRetryAfter(
    axiosError.response?.headers?.["retry-after"],
  );

  // Standard SAST Link envelope.
  if (body && typeof body === "object" && "code" in body) {
    const apiBody = body as ApiFailure;
    if (apiBody.code === 50300) {
      return new ApiError(
        "服务暂不可用，请稍后重试",
        apiBody.code,
        status,
        retryAfter,
      );
    }
    return new ApiError(apiBody.message, apiBody.code, status, retryAfter);
  }

  // OAuth / OIDC RFC-style errors (e.g. /oauth/token, /userinfo).
  if (body && typeof body === "object" && "error" in body) {
    const oauthBody = body as OAuthErrorBody;
    return new ApiError(
      oauthBody.error_description || oauthBody.error,
      0,
      status,
      retryAfter,
    );
  }

  // Fail-closed dependency unavailable without a parsed body.
  if (status === 503) {
    return new ApiError("服务暂不可用，请稍后重试", 0, status, retryAfter);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0, status, retryAfter);
  }

  return new ApiError("网络错误", 0, status, retryAfter);
}
