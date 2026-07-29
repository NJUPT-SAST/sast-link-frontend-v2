import {
  generateStars,
  twinkleOpacity,
  drawStars,
  MAX_STARS,
  type Star,
} from "./starfield";

describe("generateStars", () => {
  it("is deterministic for the same seed", () => {
    expect(generateStars(179, 1440, 900)).toEqual(generateStars(179, 1440, 900));
  });

  it("caps the star count at MAX_STARS", () => {
    expect(generateStars(1, 8000, 6000)).toHaveLength(MAX_STARS);
  });

  it("keeps every star inside valid ranges", () => {
    for (const s of generateStars(7, 1440, 900)) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(1);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThan(1);
      expect([0, 1, 2]).toContain(s.layer);
      expect(s.size).toBeGreaterThanOrEqual(1);
      expect(s.size).toBeLessThanOrEqual(3);
      expect(s.period).toBeGreaterThanOrEqual(1.4);
      expect(s.period).toBeLessThanOrEqual(3.8);
      expect(Math.abs(s.driftX) + Math.abs(s.driftY)).toBeGreaterThan(0);
      expect(typeof s.plus).toBe("boolean");
    }
  });

  it("scales count with viewport area", () => {
    expect(generateStars(3, 1440, 900).length).toBeGreaterThan(
      generateStars(3, 480, 320).length,
    );
  });
});

describe("twinkleOpacity", () => {
  const star: Star = { x: 0.5, y: 0.5, size: 2, layer: 1, phase: 0, period: 3, plus: false, driftX: 0.001, driftY: -0.001 };

  it("breathes between 0.15 and 1", () => {
    for (let t = 0; t < 6; t += 0.1) {
      const v = twinkleOpacity(star, t);
      expect(v).toBeGreaterThanOrEqual(0.15 - 1e-9);
      expect(v).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});

describe("drawStars", () => {
  it("draws one rect per star plus four arms per plus star", () => {
    const stars: Star[] = [
      { x: 0.1, y: 0.2, size: 1, layer: 0, phase: 0, period: 3, plus: false, driftX: 0.001, driftY: 0.001 },
      { x: 0.3, y: 0.4, size: 2, layer: 2, phase: 1, period: 3, plus: true, driftX: -0.001, driftY: 0.002 },
    ];
    const ctx = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      fillStyle: "",
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    drawStars(ctx, stars, {
      width: 100, height: 100, dpr: 1, timeSec: 1, offsetX: 0.5, offsetY: -0.5, color: "#fff",
    });

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
    expect(ctx.fillStyle).toBe("#fff");
    expect(ctx.fillRect).toHaveBeenCalledTimes(1 + 5);
  });
});
