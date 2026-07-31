describe("session helpers", () => {
  beforeEach(() => {
    localStorage.clear();
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
    expect(localStorage.getItem("Token")).not.toBeNull();
  });

  it("removes legacy and malformed token payloads", async () => {
    const { getSession } = await import("./token");

    localStorage.setItem("Token", JSON.stringify("legacy-token"));
    expect(getSession()).toBeNull();
    expect(localStorage.getItem("Token")).toBeNull();

    localStorage.setItem("Token", "not-json");
    expect(getSession()).toBeNull();
    expect(localStorage.getItem("Token")).toBeNull();
  });
});
