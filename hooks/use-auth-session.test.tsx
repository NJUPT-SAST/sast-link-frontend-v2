import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

const mockRefreshFromCookie = jest.fn();
const mockGetSession = jest.fn();
const mockSetSession = jest.fn();
const mockCreateSession = jest.fn();
// Clearing the session is the revocation handler's cue to re-probe; make the
// mocked getSession reflect that so the re-resolution actually probes.
const mockClearSession = jest.fn(() => mockGetSession.mockReturnValue(null));

jest.mock("@/lib/api/auth", () => ({
  refreshFromCookie: () => mockRefreshFromCookie(),
}));
jest.mock("@/lib/token", () => ({
  getSession: () => mockGetSession(),
  setSession: (session: unknown) => mockSetSession(session),
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  clearSession: () => mockClearSession(),
}));

import { useAuthSession } from "./use-auth-session";

const tokenPair = {
  access_token: "new-at",
  refresh_token: "new-rt",
  token_type: "Bearer",
  expires_in: 300,
};

function unauthorized() {
  const error = new Error("Request failed with status code 401") as Error & {
    response?: { status: number };
    isAxiosError?: boolean;
  };
  error.response = { status: 401 };
  error.isAxiosError = true;
  return error;
}

function concurrentRefresh() {
  const error = unauthorized() as Error & {
    response?: { status: number; data?: { code?: number } };
  };
  error.response!.data = { code: 40108 };
  return error;
}

describe("useAuthSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockReturnValue(null);
  });

  it("resolves to unauthenticated immediately on a plain 401", async () => {
    // A plain 401 (no cookie, or a definitively dead one) is not a concurrent
    // refresh — no retry, so a signed-out visitor is not made to wait.
    mockRefreshFromCookie.mockRejectedValue(unauthorized());
    const { result } = renderHook(() => useAuthSession());

    await act(async () => {});
    await waitFor(() => expect(result.current).toBe("unauthenticated"));
    expect(mockRefreshFromCookie).toHaveBeenCalledTimes(1);
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it("recovers from a cold-start 401 race when the retry succeeds", async () => {
    jest.useFakeTimers();
    try {
      mockRefreshFromCookie
        .mockRejectedValueOnce(concurrentRefresh()) // loser of a multi-tab rotation (40108)
        .mockResolvedValueOnce({ data: { data: tokenPair } });
      mockCreateSession.mockReturnValue({
        accessToken: "new-at",
        expiresAt: 5,
      });
      const { result } = renderHook(() => useAuthSession());

      await act(async () => {});
      expect(mockRefreshFromCookie).toHaveBeenCalledTimes(1);
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      await waitFor(() => expect(result.current).toBe("authenticated"));
      expect(mockRefreshFromCookie).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it("runs a single probe under StrictMode", async () => {
    jest.useFakeTimers();
    try {
      // StrictMode double-invokes effects in dev; two probes would race the
      // cookie's rotating refresh token, so the ref guard must collapse them.
      mockRefreshFromCookie.mockRejectedValue(unauthorized());
      renderHook(() => useAuthSession(), {
        wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
      });
      expect(mockRefreshFromCookie).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("re-resolves and drops the session after a cross-tab revocation", async () => {
    jest.useFakeTimers();
    try {
      mockGetSession.mockReturnValue({
        accessToken: "at",
        expiresAt: Date.now() + 3600_000,
      });
      mockRefreshFromCookie.mockRejectedValue(unauthorized());
      const { result } = renderHook(() => useAuthSession());

      await waitFor(() => expect(result.current).toBe("authenticated"));

      // Another tab logged out and wrote the revocation marker.
      await act(async () => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "sast:auth-invalidated",
            newValue: String(Date.now()),
            storageArea: localStorage,
          }),
        );
      });

      expect(mockClearSession).toHaveBeenCalled();
      // Re-resolution probes the (now gone) cookie → 401 → retry → 401.
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      await waitFor(() => expect(result.current).toBe("unauthenticated"));
    } finally {
      jest.useRealTimers();
    }
  });

  it("skips the probe when the tab already holds a session", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "at",
      expiresAt: Date.now() + 3600_000,
    });
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current).toBe("authenticated"));
    expect(mockRefreshFromCookie).not.toHaveBeenCalled();
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it("rebuilds the session from a successful cookie refresh", async () => {
    mockCreateSession.mockReturnValue({
      accessToken: "new-at",
      expiresAt: 5,
    });
    mockRefreshFromCookie.mockResolvedValue({ data: { data: tokenPair } });
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current).toBe("authenticated"));
    expect(mockCreateSession).toHaveBeenCalledWith("new-at", 300);
    expect(mockSetSession).toHaveBeenCalledWith({
      accessToken: "new-at",
      expiresAt: 5,
    });
  });

  it("refuses a malformed token payload instead of caching it", async () => {
    mockRefreshFromCookie.mockResolvedValue({
      data: { data: { user: { id: 1 } } }, // no access_token / refresh_token
    });
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current).toBe("unauthenticated"));
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it("retries once on a transient network failure before giving up", async () => {
    jest.useFakeTimers();
    try {
      mockRefreshFromCookie
        .mockRejectedValueOnce(new Error("Network Error"))
        .mockResolvedValueOnce({ data: { data: tokenPair } });
      const { result } = renderHook(() => useAuthSession());

      await act(async () => {});
      expect(mockRefreshFromCookie).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });
      await waitFor(() => expect(result.current).toBe("authenticated"));
      expect(mockRefreshFromCookie).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
