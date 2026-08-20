import {
  RAMP,
  buildField,
  computeAsciiGrid,
  diffuseToLevels,
  luma601,
  waveOffset,
} from "./ascii-field";

describe("computeAsciiGrid", () => {
  it("derives rows from the source aspect and cell ratio", () => {
    // 768px wide, 6px glyph advance, logo aspect ~0.52.
    const g = computeAsciiGrid(768, 131 / 252, 6);
    expect(g.cols).toBe(128);
    expect(g.rows).toBe(Math.round(128 * (131 / 252) * 0.6));
    expect(g.cellW).toBe(6);
    expect(g.cellH).toBe(10);
  });

  it("clamps columns for very narrow and very wide containers", () => {
    expect(computeAsciiGrid(100, 0.5, 6).cols).toBe(24);
    expect(computeAsciiGrid(4000, 0.5, 6).cols).toBe(220);
  });

  it("falls back to a nominal advance when measurement is unavailable", () => {
    const g = computeAsciiGrid(768, 0.5, 0);
    expect(g.cellW).toBeCloseTo(10 * 0.62, 5);
  });

  it("gives low-end devices a coarser grid", () => {
    const fine = computeAsciiGrid(768, 0.5, 6);
    const coarse = computeAsciiGrid(768, 0.5, 7.8, 13, true);
    expect(coarse.cols).toBeLessThan(fine.cols);
  });
});

describe("luma601", () => {
  it("maps black to 0 and white to 255", () => {
    expect(luma601(0, 0, 0)).toBe(0);
    expect(luma601(255, 255, 255)).toBeCloseTo(255, 0);
  });
});

describe("waveOffset", () => {
  it("is deterministic per cell and timestamp", () => {
    expect(waveOffset(0.3, 0.7, 100, 40, 1.5)).toBe(
      waveOffset(0.3, 0.7, 100, 40, 1.5),
    );
  });

  it("stays within amplitude and evolves with time", () => {
    let max = 0;
    for (let i = 0; i < 50; i++) {
      max = Math.max(max, Math.abs(waveOffset(i / 49, 0.5, 100, 40, 0)));
    }
    expect(max).toBeLessThanOrEqual(44 + 1e-9);
    expect(waveOffset(0.5, 0.5, 100, 40, 0)).not.toBe(
      waveOffset(0.5, 0.5, 100, 40, 0.7),
    );
  });
});

describe("diffuseToLevels", () => {
  it("leaves solid extremes untouched", () => {
    expect(Array.from(diffuseToLevels(new Float32Array(64).fill(255), 8, 8, 12))).toEqual(
      new Array(64).fill(255),
    );
    expect(Array.from(diffuseToLevels(new Float32Array(64), 8, 8, 12))).toEqual(
      new Array(64).fill(0),
    );
  });

  it("preserves the average of a flat mid field", () => {
    const out = diffuseToLevels(new Float32Array(1600).fill(128), 40, 40, 12);
    const mean = out.reduce((a, b) => a + b, 0) / out.length;
    expect(Math.abs(mean - 128)).toBeLessThan(25);
  });

  it("quantises exactly when strength is zero", () => {
    const step = 255 / 11;
    const out = diffuseToLevels(new Float32Array(64).fill(128), 8, 8, 12, 0);
    for (const v of Array.from(out)) expect(v).toBeCloseTo(Math.round(128 / step) * step, 5);
  });

  it("stays bounded on a high-contrast field with negative cells", () => {
    // A bright block on a dark, wave-dipped background: error must diffuse
    // (/16 divisor), never cascade — a missing divisor zeroes the field.
    const cols = 119;
    const rows = 37;
    const field = new Float32Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        field[y * cols + x] = x > 30 && x < 90 && y > 10 && y < 27 ? 216 : -40;
      }
    }
    const out = diffuseToLevels(field, cols, rows, 12);
    expect(Math.max(...Array.from(out))).toBeGreaterThan(200);
    expect(Math.min(...Array.from(out))).toBeGreaterThanOrEqual(0);
    // Deep background stays at the bottom band.
    expect(out[0]).toBe(0);
  });
});

describe("buildField", () => {
  const flat = (v: number, cols = 24, rows = 12) => new Float32Array(cols * rows).fill(v);

  it("renders a solid bright field at the top bands with full alpha", () => {
    const { idx, alpha } = buildField(flat(1), 24, 12, 0);
    for (let i = 0; i < idx.length; i++) {
      expect(idx[i]).toBeGreaterThanOrEqual(RAMP.length - 3);
      expect(alpha[i]).toBeGreaterThan(0);
    }
  });

  it("keeps a dark field mostly blank; any grain stays sparse and faint", () => {
    // Grain density legitimately waxes and wanes as the wave drifts, so only
    // the invariants are asserted: never dense, never past the dot bands,
    // always faint, blanks stay untouched.
    let sawAnyGrain = false;
    for (const t of [0, 0.7, 1.9, 3.3]) {
      const { idx, alpha } = buildField(flat(0), 24, 12, t);
      const lit = idx.filter((b) => b > 0).length;
      sawAnyGrain ||= lit > 0;
      expect(lit).toBeLessThan(idx.length * 0.3);
      expect(Math.max(...Array.from(idx))).toBeLessThanOrEqual(2);
      for (let i = 0; i < idx.length; i++) {
        if (idx[i] === 0) expect(alpha[i]).toBe(0);
        else expect(alpha[i]).toBeLessThan(0.5);
      }
    }
    expect(sawAnyGrain).toBe(true);
  });

  it("alternates alpha in a checkerboard on a uniform area", () => {
    const { alpha } = buildField(flat(1), 24, 12, 0);
    expect(alpha[0]).toBeGreaterThan(alpha[1]);
    expect(alpha[1]).toBeCloseTo(alpha[0]! * 0.85, 5);
  });

  it("is deterministic per timestamp and animates across timestamps", () => {
    const a = buildField(flat(0.5), 24, 12, 1.5);
    const b = buildField(flat(0.5), 24, 12, 1.5);
    const c = buildField(flat(0.5), 24, 12, 2.2);
    expect(Array.from(a.idx)).toEqual(Array.from(b.idx));
    expect(Array.from(a.idx)).not.toEqual(Array.from(c.idx));
  });
});
