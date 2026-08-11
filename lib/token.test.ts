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
});
