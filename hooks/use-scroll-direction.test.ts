import { renderHook, waitFor } from "@testing-library/react";

import { useScrollDirection } from "./use-scroll-direction";

// jsdom reports scrollHeight 0 and innerHeight 768, so every scroll position
// would read as "at or beyond the boundary" (maxScrollY negative). The tests
// mount a realistic scrollable document (2000px tall, 768px viewport →
// maxScrollY 1232) the way a phone browser would.
function mountScrollableDocument() {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: 2000,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 768,
  });
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    writable: true,
    value,
  });
  window.dispatchEvent(new Event("scroll"));
}

describe("useScrollDirection", () => {
  beforeEach(() => {
    mountScrollableDocument();
    setScrollY(0);
  });

  it("should return null initially", () => {
    const { result } = renderHook(() => useScrollDirection());
    expect(result.current).toBeNull();
  });

  it("should detect downward scroll", async () => {
    const { result } = renderHook(() => useScrollDirection(10));

    setScrollY(50);

    await waitFor(() => {
      expect(result.current).toBe("down");
    });
  });

  it("should detect upward scroll", async () => {
    const { result } = renderHook(() => useScrollDirection(10));

    setScrollY(100);
    await waitFor(() => {
      expect(result.current).toBe("down");
    });

    setScrollY(50);
    await waitFor(() => {
      expect(result.current).toBe("up");
    });
  });

  it("should respect threshold", async () => {
    const { result } = renderHook(() => useScrollDirection(20));

    setScrollY(10);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current).toBeNull();
  });

  it("keeps the bar visible through a top rubber-band bounce", async () => {
    // iOS pull-to-bounce at the document top: scrollY dips negative and
    // springs back to 0. The bounce-back must not register as a downward
    // scroll — the page cannot scroll further up here, so a hidden bar would
    // have no scroll event to bring it back.
    const { result } = renderHook(() => useScrollDirection(10));

    setScrollY(-40);
    await waitFor(() => {
      expect(result.current).toBe("up");
    });

    setScrollY(0);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(result.current).toBe("up");
  });

  it("keeps the bar visible through a bottom rubber-band bounce", async () => {
    // maxScrollY is 1232 (2000 − 768): the bottom overshoot reads 1300 and
    // springs back. Both ends of the bounce pin the bar visible.
    const { result } = renderHook(() => useScrollDirection(10));

    setScrollY(1232);
    await waitFor(() => {
      expect(result.current).toBe("up");
    });

    setScrollY(1300);
    setScrollY(1232);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(result.current).toBe("up");
  });

  it("pins the bar visible on a page shorter than the viewport", async () => {
    // No scrollable range at all (maxScrollY ≤ 0): every rubber-band tick is
    // a boundary tick and the bar must stay operable.
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 400,
    });

    const { result } = renderHook(() => useScrollDirection(10));

    setScrollY(-25);
    await waitFor(() => {
      expect(result.current).toBe("up");
    });
  });
});
