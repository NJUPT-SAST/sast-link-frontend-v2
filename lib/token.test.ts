describe("session helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads, writes and clears a token pair", async () => {
    const { clearSession, getSession, setSession } = await import("./token");
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: 123456,
    };

    expect(getSession()).toBeNull();
    setSession(session);
    expect(getSession()).toEqual(session);

    clearSession();
    expect(getSession()).toBeNull();
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
