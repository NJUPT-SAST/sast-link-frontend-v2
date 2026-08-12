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
      default: { create, isAxiosError: jest.fn(() => false) },
    }));
    jest.doMock("@/lib/token", () => ({
      clearSession: jest.fn(),
      getSession: jest.fn(() => ({ accessToken: "access-token" })),
      setSession: jest.fn(),
      createSession: jest.fn(),
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
      default: { create, isAxiosError: jest.fn(() => false) },
    }));
    jest.doMock("@/lib/token", () => ({
      clearSession: jest.fn(),
      getSession: jest.fn(() => ({
        accessToken: "expired-access-token",
        expiresAt: 0,
      })),
      setSession: jest.fn(),
      createSession: jest.fn((accessToken: string, expiresIn: number) => ({
        accessToken,
        expiresAt: expiresIn,
      })),
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

    expect(refreshPost).toHaveBeenCalledWith("/auth/refresh", {}, { timeout: 10_000 });
    expect(retryConfig.headers.Authorization).toBe("Bearer new-access-token");
    expect(apiClient).toHaveBeenCalledWith(retryConfig);
    expect(result).toEqual({ data: "retried" });
  });

  it("clears session and redirects to login when refresh fails", async () => {
    jest.useFakeTimers();
    try {
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
      default: {
        create,
        isAxiosError: jest.fn(
          (error: unknown) =>
            (error as { response?: { status: number } })?.response?.status === 401,
        ),
      },
    }));
    const clearSession = jest.fn();
    const redirectToLogin = jest.fn();
    jest.doMock("@/lib/token", () => ({
      clearSession,
      getSession: jest.fn(() => ({
        accessToken: "expired-access-token",
        expiresAt: 0,
      })),
      setSession: jest.fn(),
      createSession: jest.fn(),
    }));
    jest.doMock("@/lib/api/redirect", () => ({
      redirectToLogin,
    }));

    const { apiClient } = await import("./client");
    const responseInterceptor = responseUse.mock.calls[0][1];

    const refresh401 = new Error("refresh failed") as Error & {
      response?: { status: number };
      isAxiosError?: boolean;
    };
    refresh401.response = { status: 401 };
    refresh401.isAxiosError = true;
    // Both the first attempt and the 600ms retry must 401 — a definitive dead
    // session is what clears + redirects.
    instances[1].post.mockRejectedValue(refresh401);

    const retryConfig = { headers: {}, url: "/user/profile" };
    const resultPromise = responseInterceptor({
      response: { status: 401 },
      config: retryConfig,
    });
    // Attach the rejection handler before the retry timer fires so the 401
    // rejection is not reported as unhandled.
    const rejection = expect(resultPromise).rejects.toThrow("refresh failed");
    await jest.advanceTimersByTimeAsync(600);
    await rejection;

    expect(clearSession).toHaveBeenCalled();
    expect(redirectToLogin).toHaveBeenCalled();
    expect(apiClient).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("retries a refresh that 401s (multi-tab race) and recovers", async () => {
    jest.useFakeTimers();
    try {
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
      const isAxiosError = jest.fn(
        (error: unknown) =>
          (error as { response?: { status: number } })?.response?.status === 401,
      );
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
        default: { create, isAxiosError },
      }));
      jest.doMock("@/lib/token", () => ({
        clearSession: jest.fn(),
        getSession: jest.fn(() => ({ accessToken: "expired", expiresAt: 0 })),
        setSession: jest.fn(),
        createSession: jest.fn((accessToken: string, expiresIn: number) => ({
          accessToken,
          expiresAt: expiresIn,
        })),
      }));

      await import("./client");
      const responseInterceptor = responseUse.mock.calls[0][1];
      const refreshPost = instances[1].post;

      const race401 = new Error("race") as Error & {
        response?: { status: number; data?: { code?: number } };
        isAxiosError?: boolean;
      };
      race401.response = { status: 401, data: { code: 40108 } };
      race401.isAxiosError = true;

      // First refresh loses a multi-tab rotation (401 within the grace window),
      // the retry reads the winner's token from the cookie and succeeds.
      refreshPost
        .mockRejectedValueOnce(race401)
        .mockResolvedValueOnce({
          data: {
            code: 0,
            message: "ok",
            data: { access_token: "fresh", expires_in: 3600 },
          },
        });

      const retryConfig = { headers: {} as Record<string, string>, url: "/user/profile" };
      const resultPromise = responseInterceptor({
        response: { status: 401 },
        config: retryConfig,
      });
      await jest.advanceTimersByTimeAsync(600);
      await expect(resultPromise).resolves.toEqual({ data: "retried" });
      expect(refreshPost).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it("gives up and redirects when the refresh retry also 401s", async () => {
    jest.useFakeTimers();
    try {
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
      const isAxiosError = jest.fn(
        (error: unknown) =>
          (error as { response?: { status: number } })?.response?.status === 401,
      );
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
        default: { create, isAxiosError },
      }));
      const clearSession = jest.fn();
      const redirectToLogin = jest.fn();
      jest.doMock("@/lib/token", () => ({
        clearSession,
        getSession: jest.fn(() => ({ accessToken: "expired", expiresAt: 0 })),
        setSession: jest.fn(),
        createSession: jest.fn(),
      }));
      jest.doMock("@/lib/api/redirect", () => ({ redirectToLogin }));

      await import("./client");
      const responseInterceptor = responseUse.mock.calls[0][1];
      const refreshPost = instances[1].post;

      const race401 = new Error("race") as Error & {
        response?: { status: number; data?: { code?: number } };
        isAxiosError?: boolean;
      };
      race401.response = { status: 401, data: { code: 40108 } };
      race401.isAxiosError = true;

      refreshPost.mockRejectedValue(race401);

      const retryConfig = { headers: {}, url: "/user/profile" };
      const resultPromise = responseInterceptor({
        response: { status: 401 },
        config: retryConfig,
      });
      // Attach the rejection handler before the timer fires so the race-401
      // rejection is not reported as unhandled.
      const rejection = expect(resultPromise).rejects.toThrow("race");
      await jest.advanceTimersByTimeAsync(600);
      await rejection;
      expect(refreshPost).toHaveBeenCalledTimes(2);
      expect(clearSession).toHaveBeenCalled();
      expect(redirectToLogin).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not refresh for 401s on NO_REFRESH_PATHS", async () => {
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
      isAxiosError: jest.fn(() => false),
      default: { create },
    }));
    jest.doMock("@/lib/token", () => ({
      clearSession: jest.fn(),
      getSession: jest.fn(() => ({ accessToken: "expired", expiresAt: 0 })),
      setSession: jest.fn(),
      createSession: jest.fn(),
    }));

    await import("./client");
    const responseInterceptor = responseUse.mock.calls[0][1];
    const refreshPost = instances[1].post;

    const retryConfig = { headers: {}, url: "/user/login" };
    // The interceptor re-throws the original (plain-object) 401 error without
    // refreshing when the URL is in NO_REFRESH_PATHS.
    await expect(
      responseInterceptor({ response: { status: 401 }, config: retryConfig }),
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(refreshPost).not.toHaveBeenCalled();
  });

  it("does not clear the session or redirect when the refresh fails with a network error", async () => {
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
      default: { create, isAxiosError: jest.fn(() => false) },
    }));
    const clearSession = jest.fn();
    const redirectToLogin = jest.fn();
    jest.doMock("@/lib/token", () => ({
      clearSession,
      getSession: jest.fn(() => ({ accessToken: "expired", expiresAt: 0 })),
      setSession: jest.fn(),
      createSession: jest.fn(),
    }));
    jest.doMock("@/lib/api/redirect", () => ({ redirectToLogin }));

    await import("./client");
    const responseInterceptor = responseUse.mock.calls[0][1];
    const refreshPost = instances[1].post;

    // A transient network failure during refresh must NOT destroy the session
    // or hard-navigate to /login — only a definitive 401 (dead cookie) does.
    refreshPost.mockRejectedValueOnce(new Error("Network Error"));

    const retryConfig = { headers: {}, url: "/user/profile" };
    await expect(
      responseInterceptor({ response: { status: 401 }, config: retryConfig }),
    ).rejects.toThrow("Network Error");
    expect(clearSession).not.toHaveBeenCalled();
    expect(redirectToLogin).not.toHaveBeenCalled();
  });
});
