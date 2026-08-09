import { render, screen } from "@testing-library/react";

import { Starfield, isLowEndDevice } from "./starfield";

describe("Starfield", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders a full-viewport aria-hidden canvas", () => {
    render(<Starfield />);
    const canvas = screen.getByTestId("starfield");
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveClass("pointer-events-none", "fixed", "inset-0", "-z-10");
  });

  it("does not crash when the 2d context is unavailable (jsdom)", () => {
    expect(() => render(<Starfield />)).not.toThrow();
  });
});

describe("isLowEndDevice", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("flags low-core devices", () => {
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 2, configurable: true });
    expect(isLowEndDevice()).toBe(true);
  });

  it("does not flag capable desktop devices", () => {
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 8, configurable: true });
    Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
    window.matchMedia = jest.fn().mockImplementation(
      () => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }) as unknown as MediaQueryList,
    );
    expect(isLowEndDevice()).toBe(false);
  });

  it("flags coarse pointers even on capable hardware", () => {
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 8, configurable: true });
    Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
    window.matchMedia = jest.fn().mockImplementation(
      (query: string) => ({ matches: query.includes("coarse"), addEventListener: jest.fn(), removeEventListener: jest.fn() }) as unknown as MediaQueryList,
    );
    expect(isLowEndDevice()).toBe(true);
  });
});
