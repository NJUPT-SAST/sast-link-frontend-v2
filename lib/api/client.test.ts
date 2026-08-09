describe("lib/api/client", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("uses the backend base URL and attaches the Bearer access token", async () => {
    const requestUse = jest.fn();
    const responseUse = jest.fn();
    const create = jest.fn(() => ({
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse },
      },
    }));

    jest.doMock("axios", () => ({
      __esModule: true,
      AxiosHeaders: {
        from: (headers: Record<string, string>) => ({
          ...headers,
          set(key: string, value: string) {
            Object.assign(this, { [key]: value });
          },
        }),
      },
      default: { create },
    }));
    jest.doMock("@/lib/token", () => ({
      clearSession: jest.fn(),
      getSession: jest.fn(() => ({ accessToken: "access-token" })),
      setSession: jest.fn(),
    }));

    await import("./client");

    expect(create).toHaveBeenNthCalledWith(1, { baseURL: "http://localhost:8080" });
    expect(requestUse).toHaveBeenCalledTimes(1);
    expect(responseUse).toHaveBeenCalledTimes(1);

    const interceptor = requestUse.mock.calls[0][0];
    const config = interceptor({ headers: {} });
    expect(config.headers.Authorization).toBe("Bearer access-token");
  });

  it("refreshes on 401 and retries the request", async () => {
    const requestUse = jest.fn();
    const responseUse = jest.fn();
    const instances: Array<{ post: jest.Mock; (config: unknown): unknown }> = [];
    const create = jest.fn(() => {
      const instance = Object.assign(jest.fn(() => ({ data: "retried" })), {
        interceptors: {
          request: { use: requestUse },
          response: { use: responseUse },
        },
        post: jest.fn(),
      });
      instances.push(instance);
      return instance;
    });

    jest.doMock("axios", () => ({
      __esModule: true,
      AxiosHeaders: {
        from: (headers: Record<string, string>) => ({
          ...headers,
          set(key: string, value: string) {
            Object.assign(this, { [key]: value });
          },
        }),
      },
      default: { create },
    }));
    jest.doMock("@/lib/token", () => ({
      clearSession: jest.fn(),
      getSession: jest.fn(() => ({
        accessToken: "expired-access-token",
        refreshToken: "refresh-token",
        expiresAt: 0,
      })),
      setSession: jest.fn(),
    }));

    const { apiClient } = await import("./client");
    const responseInterceptor = responseUse.mock.calls[0][1];

    // The second axios instance is used for refresh.
    const refreshPost = instances[1].post;
    refreshPost.mockResolvedValueOnce({
      data: {
        code: 0,
        message: "ok",
        data: {
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          expires_in: 3600,
        },
      },
    });

    const retryConfig = { headers: {} as Record<string, string>, url: "/user/profile" };
    const result = await responseInterceptor({
      response: { status: 401 },
      config: retryConfig,
    });

    expect(refreshPost).toHaveBeenCalledWith("/auth/refresh", {
      refresh_token: "refresh-token",
    });
    expect(retryConfig.headers.Authorization).toBe("Bearer new-access-token");
    expect(apiClient).toHaveBeenCalledWith(retryConfig);
    expect(result).toEqual({ data: "retried" });
  });

  it("clears session and redirects to login when refresh fails", async () => {
    const requestUse = jest.fn();
    const responseUse = jest.fn();
    const instances: Array<{ post: jest.Mock; (config: unknown): unknown }> = [];
    const create = jest.fn(() => {
      const instance = Object.assign(jest.fn(), {
        interceptors: {
          request: { use: requestUse },
          response: { use: responseUse },
        },
        post: jest.fn(),
      });
      instances.push(instance);
      return instance;
    });

    jest.doMock("axios", () => ({
      __esModule: true,
      AxiosHeaders: {
        from: (headers: Record<string, string>) => ({
          ...headers,
          set(key: string, value: string) {
            Object.assign(this, { [key]: value });
          },
        }),
      },
      default: { create },
    }));
    const clearSession = jest.fn();
    const redirectToLogin = jest.fn();
    jest.doMock("@/lib/token", () => ({
      clearSession,
      getSession: jest.fn(() => ({
        accessToken: "expired-access-token",
        refreshToken: "refresh-token",
        expiresAt: 0,
      })),
      setSession: jest.fn(),
    }));
    jest.doMock("@/lib/api/redirect", () => ({
      redirectToLogin,
    }));

    const { apiClient } = await import("./client");
    const responseInterceptor = responseUse.mock.calls[0][1];

    instances[1].post.mockRejectedValueOnce(new Error("refresh failed"));

    const retryConfig = { headers: {}, url: "/user/profile" };
    await expect(
      responseInterceptor({
        response: { status: 401 },
        config: retryConfig,
      }),
    ).rejects.toThrow("refresh failed");

    expect(clearSession).toHaveBeenCalled();
    expect(redirectToLogin).toHaveBeenCalled();
    expect(apiClient).not.toHaveBeenCalled();
  });
});
