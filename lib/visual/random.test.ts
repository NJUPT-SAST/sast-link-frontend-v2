import { mulberry32 } from "./random";

describe("mulberry32", () => {
  it("produces identical sequences for the same seed", () => {
    const a = mulberry32(179);
    const b = mulberry32(179);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0, 1)", () => {
    const rnd = mulberry32(42);
    for (let i = 0; i < 200; i++) {
      const v = rnd();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 4 }, () => a());
    const seqB = Array.from({ length: 4 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });
});
