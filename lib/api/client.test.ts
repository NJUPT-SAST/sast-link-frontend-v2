describe("lib/api/client", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("uses /apis and attaches the Bearer access token", async () => {
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

    expect(create).toHaveBeenNthCalledWith(1, { baseURL: "/apis" });
    expect(requestUse).toHaveBeenCalledTimes(1);
    expect(responseUse).toHaveBeenCalledTimes(1);

    const interceptor = requestUse.mock.calls[0][0];
    const config = interceptor({ headers: {} });
    expect(config.headers.Authorization).toBe("Bearer access-token");
  });
});
