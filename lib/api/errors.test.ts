import { ApiError, toApiError } from "./errors";

describe("toApiError", () => {
  it("parses the standard envelope", () => {
    const error = toApiError({
      response: { status: 400, data: { code: 40000, message: "参数错误", data: null } },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("参数错误");
    expect(error.code).toBe(40000);
    expect(error.status).toBe(400);
  });

  it("maps 50300 to a service-unavailable message", () => {
    const error = toApiError({
      response: { status: 503, data: { code: 50300, message: "依赖服务暂不可用", data: null } },
    });

    expect(error.message).toBe("服务暂不可用，请稍后重试");
    expect(error.code).toBe(50300);
    expect(error.status).toBe(503);
  });

  it("falls back to service-unavailable for 503 without a parsed body", () => {
    const error = toApiError({
      response: { status: 503, data: null },
    });

    expect(error.message).toBe("服务暂不可用，请稍后重试");
    expect(error.status).toBe(503);
  });

  it("parses OAuth RFC error responses", () => {
    const error = toApiError({
      response: {
        status: 400,
        data: { error: "invalid_grant", error_description: "授权码已过期" },
      },
    });

    expect(error.message).toBe("授权码已过期");
    expect(error.code).toBe(0);
    expect(error.status).toBe(400);
  });

  it("uses the error field when error_description is missing", () => {
    const error = toApiError({
      response: { status: 401, data: { error: "invalid_client" } },
    });

    expect(error.message).toBe("invalid_client");
  });

  it("reads the Retry-After header", () => {
    const error = toApiError({
      response: {
        status: 429,
        headers: { "retry-after": "120" },
        data: { code: 42900, message: "请求过于频繁", data: null },
      },
    });

    expect(error.message).toBe("请求过于频繁");
    expect(error.retryAfter).toBe(120);
  });

  it("handles network errors", () => {
    const error = toApiError(new Error("Network Error"));
    expect(error.message).toBe("Network Error");
    expect(error.code).toBe(0);
  });

  it("handles unknown errors", () => {
    const error = toApiError(null);
    expect(error.message).toBe("网络错误");
    expect(error.code).toBe(0);
  });
});
