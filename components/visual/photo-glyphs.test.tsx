import { render } from "@testing-library/react";

import { PhotoGlyphs } from "./photo-glyphs";
import { PhotoGlyphsSection } from "./photo-glyphs-section";

describe("PhotoGlyphs", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders an aria-hidden canvas", () => {
    const { container } = render(<PhotoGlyphs />);
    const canvas = container.querySelector("canvas");
    expect(canvas?.tagName).toBe("CANVAS");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
  });

  it("does not crash when the 2d context is unavailable (jsdom)", () => {
    expect(() => render(<PhotoGlyphs />)).not.toThrow();
  });
});

describe("PhotoGlyphsSection", () => {
  it("renders a canvas inside a relative section", () => {
    const { container } = render(<PhotoGlyphsSection />);
    const section = container.querySelector("section");
    expect(section?.className).toContain("relative");
    expect(section?.querySelector("canvas")).toBeInTheDocument();
  });
});
