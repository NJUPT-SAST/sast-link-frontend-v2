jest.mock("@/lib/api/oauth", () => ({
  exchangeLoginCode: (...args: unknown[]) => mockExchangeLoginCode(...args),
  readPKCEVerifier: () => mockReadPKCEVerifier(),
  clearPKCEVerifier: (...args: unknown[]) => mockClearPKCEVerifier(...args),
}));

jest.mock("@/lib/token", () => ({
  createSession: (accessToken: string, expiresIn: number) => ({
    accessToken,
    expiresAt: expiresIn,
  }),
  setSession: (...args: unknown[]) => mockSetSession(...args),
}));

jest.mock("@/lib/auth-destination", () => ({
  postAuthDestination: (data: unknown, fallback: string) =>
    (data as { user: { profile_needs_completion?: boolean } }).user
      .profile_needs_completion
      ? "/profile/complete"
      : fallback,
}));

jest.mock("@/store/use-user-list-store", () => ({
  useUserListStore: { getState: () => ({ addAccount: mockAddAccount }) },
}));

jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: { getState: () => ({ resetProfile: mockResetProfile }) },
}));

import { establishLoginCodeSession } from "./login-session";

const mockExchangeLoginCode = jest.fn();
const mockSetSession = jest.fn();
const mockAddAccount = jest.fn();
const mockResetProfile = jest.fn();
const mockReadPKCEVerifier = jest.fn();
const mockClearPKCEVerifier = jest.fn();

function authResult(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      data: {
        access_token: "at",
        expires_in: 3600,
        user: { id: 7, name: "Alice", login_email: "a@b.com" },
        ...overrides,
      },
    },
  };
}

describe("establishLoginCodeSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadPKCEVerifier.mockReturnValue("staged-verifier");
  });

  it("redeems the code with the staged verifier and clears it on success", async () => {
    mockExchangeLoginCode.mockResolvedValue(authResult());

    const destination = await establishLoginCodeSession("lc_1");

    expect(mockExchangeLoginCode).toHaveBeenCalledWith("lc_1", "staged-verifier");
    expect(mockClearPKCEVerifier).toHaveBeenCalledTimes(1);
    expect(mockSetSession).toHaveBeenCalledWith({ accessToken: "at", expiresAt: 3600 });
    expect(mockResetProfile).toHaveBeenCalled();
    expect(mockAddAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        loginEmail: "a@b.com",
        name: "Alice",
        avatar: null,
        session: { accessToken: "at", expiresAt: 3600 },
      }),
    );
    expect(destination).toBe("/home");
  });

  it("routes accounts with incomplete profiles to the completion page", async () => {
    mockExchangeLoginCode.mockResolvedValue(
      authResult({ user: { id: 7, name: "Alice", login_email: "a@b.com", profile_needs_completion: true } }),
    );

    await expect(establishLoginCodeSession("lc_1")).resolves.toBe("/profile/complete");
  });

  it("propagates exchange failures to the caller", async () => {
    mockExchangeLoginCode.mockRejectedValue(new Error("bad code"));
    await expect(establishLoginCodeSession("lc_1")).rejects.toThrow("bad code");
    expect(mockSetSession).not.toHaveBeenCalled();
    // A transient failure (the code may be unconsumed server-side) keeps the
    // verifier staged so the retry can prove it.
    expect(mockClearPKCEVerifier).not.toHaveBeenCalled();
  });
});
