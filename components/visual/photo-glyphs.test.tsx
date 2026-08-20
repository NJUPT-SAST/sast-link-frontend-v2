import { render } from "@testing-library/react";

import { PhotoGlyphs } from "./photo-glyphs";


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
