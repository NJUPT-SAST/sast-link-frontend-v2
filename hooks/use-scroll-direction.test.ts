import { renderHook, waitFor } from "@testing-library/react";
import { useScrollDirection } from "./use-scroll-direction";

describe("useScrollDirection", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      value: 0,
    });
  });

  it("should return null initially", () => {
    const { result } = renderHook(() => useScrollDirection());
    expect(result.current).toBeNull();
  });

  it("should detect downward scroll", async () => {
    const { result } = renderHook(() => useScrollDirection(10));

    Object.defineProperty(window, "scrollY", { writable: true, value: 50 });
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(result.current).toBe("down");
    });
  });

  it("should detect upward scroll", async () => {
    const { result } = renderHook(() => useScrollDirection(10));

    // Scroll down first
    Object.defineProperty(window, "scrollY", { writable: true, value: 100 });
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(result.current).toBe("down");
    });

    // Then scroll up
    Object.defineProperty(window, "scrollY", { writable: true, value: 50 });
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(result.current).toBe("up");
    });
  });

  it("should respect threshold", async () => {
    const { result } = renderHook(() => useScrollDirection(20));

    Object.defineProperty(window, "scrollY", { writable: true, value: 10 });
    window.dispatchEvent(new Event("scroll"));

    // Wait a bit to ensure any async updates would have happened
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should still be null because scroll is below threshold
    expect(result.current).toBeNull();
  });
});

