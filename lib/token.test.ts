describe("session helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
    // The in-memory cache is module state; reset the module so each test starts
    // with a cold cache and cannot observe a previous test's cached session.
    jest.resetModules();
  });

  it("reads, writes and clears a token pair", async () => {
    const { clearSession, getSession, setSession } = await import("./token");
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 3600_000,
    };

    expect(getSession()).toBeNull();
    setSession(session);
    expect(getSession()).toEqual(session);

    clearSession();
    expect(getSession()).toBeNull();
  });

  it("keeps expired sessions so the refresh interceptor can rotate them", async () => {
    const { getSession, setSession } = await import("./token");
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() - 1000,
    };
    setSession(session);
    expect(getSession()).toEqual(session);
    expect(sessionStorage.getItem("Token")).not.toBeNull();
  });

  it("returns a copy so mutating it cannot poison the cached session", async () => {
    const { getSession, setSession } = await import("./token");
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 3600_000,
    };
    setSession(session);

    const first = getSession();
    if (first) first.accessToken = "mutated";

    expect(getSession()).toEqual(session);
    expect(getSession()?.accessToken).toBe("access-token");
  });

  it("returns a copy on the cold path too (fresh module, seeded storage)", async () => {
    // Page refresh clears the module cache while sessionStorage survives, so the
    // first getSession() after reload hydrates the cache. That hydration must
    // not hand out the cached reference.
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 3600_000,
    };
    sessionStorage.setItem("Token", JSON.stringify(session));

    const { getSession } = await import("./token");
    const first = getSession();
    expect(first).toEqual(session);
    if (first) first.accessToken = "mutated";

    expect(getSession()?.accessToken).toBe("access-token");
  });

  it("removes legacy and malformed token payloads", async () => {
    const { getSession } = await import("./token");

    sessionStorage.setItem("Token", JSON.stringify("legacy-token"));
    expect(getSession()).toBeNull();
    expect(sessionStorage.getItem("Token")).toBeNull();

    sessionStorage.setItem("Token", "not-json");
    expect(getSession()).toBeNull();
    expect(sessionStorage.getItem("Token")).toBeNull();
  });

  it("keeps serving the in-memory session when sessionStorage writes fail", async () => {
    // Private mode / quota: setItem throws, but the memory cache must still work
    // for the rest of the tab's life.
    const { getSession, setSession } = await import("./token");
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 3600_000,
    };
    const spy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota exceeded");
      });
    try {
      setSession(session);
    } finally {
      spy.mockRestore();
    }
    expect(getSession()).toEqual(session);
  });

  it("returns null when the cold-path sessionStorage read throws", async () => {
    const spy = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("storage denied");
      });
    try {
      const { getSession } = await import("./token");
      expect(getSession()).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it("does not throw when sessionStorage removal fails on clear", async () => {
    const { clearSession, setSession } = await import("./token");
    setSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 3600_000,
    });
    const spy = jest
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("storage denied");
      });
    try {
      // The memory cache is dropped first; a stale storage copy may re-hydrate
      // on a later read, which is the accepted degradation when the store is
      // broken — the important guarantee is that logout never throws.
      expect(() => clearSession()).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });
});
