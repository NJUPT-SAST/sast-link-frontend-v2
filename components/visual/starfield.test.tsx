import { render, screen } from "@testing-library/react";

import { Starfield } from "./starfield";

describe("Starfield", () => {
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
