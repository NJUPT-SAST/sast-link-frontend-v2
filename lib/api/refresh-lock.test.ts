import { withRefreshLock } from "./refresh-lock";

const LOCK_NAME = "sast-link:auth-refresh";

function installLockManager(request: ((name: string, options: unknown, cb: (lock: unknown) => Promise<unknown>) => Promise<unknown>) | undefined) {
  Object.defineProperty(window.navigator, "locks", {
    configurable: true,
    value: request ? { request } : undefined,
  });
}

describe("lib/api/refresh-lock", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "locks");

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(window.navigator, "locks", originalDescriptor);
    } else {
      // jsdom ships no LockManager at all; undo whatever the test installed.
      delete (window.navigator as { locks?: unknown }).locks;
    }
  });

  it("runs the operation through navigator.locks.request with an exclusive lock", async () => {
    const request = jest.fn((_name, _options, callback) => callback({}));
    installLockManager(request);

    const result = await withRefreshLock(async () => "token");

    expect(result).toBe("token");
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(LOCK_NAME, { mode: "exclusive" }, expect.any(Function));
  });

  it("runs the operation directly when navigator.locks is unavailable", async () => {
    installLockManager(undefined);

    await expect(withRefreshLock(async () => "token")).resolves.toBe("token");
  });

  it("runs the operation directly when navigator.locks exists without request", async () => {
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: {},
    });

    await expect(withRefreshLock(async () => "token")).resolves.toBe("token");
  });

  it("propagates the operation's rejection", async () => {
    installLockManager((_name, _options, callback) => callback({}));

    await expect(withRefreshLock(async () => Promise.reject(new Error("refresh failed")))).rejects.toThrow(
      "refresh failed",
    );
  });
});
