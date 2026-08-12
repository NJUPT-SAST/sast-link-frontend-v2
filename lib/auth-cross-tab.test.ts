import { markAuthInvalidated, onAuthInvalidated } from "./auth-cross-tab";

const INVALIDATED_KEY = "sast:auth-invalidated";

function fire(
  key: string,
  newValue: string | null,
  area: Storage = localStorage,
) {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue, storageArea: area }));
}

describe("lib/auth-cross-tab", () => {
  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("fires the callback on a localStorage write of the marker", () => {
    const cb = jest.fn();
    const off = onAuthInvalidated(cb);
    fire(INVALIDATED_KEY, String(Date.now()));
    expect(cb).toHaveBeenCalledTimes(1);
    off();
  });

  it("ignores same-name sessionStorage writes and marker removals", () => {
    const cb = jest.fn();
    const off = onAuthInvalidated(cb);
    fire(INVALIDATED_KEY, String(Date.now()), sessionStorage); // wrong storage area
    fire(INVALIDATED_KEY, null); // removal, not a revocation
    expect(cb).not.toHaveBeenCalled();
    off();
  });

  it("ignores other keys", () => {
    const cb = jest.fn();
    const off = onAuthInvalidated(cb);
    fire("some-other-key", "x");
    expect(cb).not.toHaveBeenCalled();
    off();
  });

  it("unsubscribes", () => {
    const cb = jest.fn();
    const off = onAuthInvalidated(cb);
    off();
    fire(INVALIDATED_KEY, String(Date.now()));
    expect(cb).not.toHaveBeenCalled();
  });

  it("markAuthInvalidated writes the marker", () => {
    markAuthInvalidated();
    expect(localStorage.getItem(INVALIDATED_KEY)).not.toBeNull();
  });
});
