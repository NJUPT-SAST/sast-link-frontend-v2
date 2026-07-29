import type { AxiosError } from "axios";

import type { ApiFailure } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<ApiFailure>;
  const body = axiosError.response?.data;

  if (body && typeof body.code === "number") {
    return new ApiError(body.message, body.code, axiosError.response?.status);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0, axiosError.response?.status);
  }

  return new ApiError("网络错误", 0);
}
