import {
  foldIncompleteCounts,
  INCOMPLETE_BUCKET_KEY,
} from "./stats-incomplete";

describe("foldIncompleteCounts", () => {
  it("subtracts incomplete counts from their buckets and appends one 未补全 slice", () => {
    const items: [string, number][] = [
      ["freshman", 50],
      ["member", 30],
      ["lecturer", 20],
      ["admin", 10],
    ];
    const incomplete = { freshman: 3, member: 2 };
    const result = foldIncompleteCounts(items, incomplete);
    expect(result).toEqual([
      ["freshman", 47],
      ["member", 28],
      ["lecturer", 20],
      ["admin", 10],
      [INCOMPLETE_BUCKET_KEY, 5],
    ]);
    // Total is conserved: 47+28+20+10+5 === 50+30+20+10.
    expect(result.reduce((sum, [, count]) => sum + count, 0)).toBe(110);
  });

  it("emits no 未补全 bucket when no account is incomplete", () => {
    const items: [string, number][] = [["freshman", 10]];
    const result = foldIncompleteCounts(items, {});
    expect(result).toEqual([["freshman", 10]]);
  });

  // A frontend deployed ahead of the backend release that adds the buckets sees
  // no such key at all. That must render the true buckets, not throw: the
  // overview page has no error boundary above it.
  it("renders the true buckets when the dimension is absent", () => {
    const items: [string, number][] = [
      ["freshman", 10],
      ["member", 5],
    ];
    expect(foldIncompleteCounts(items)).toEqual(items);
    expect(foldIncompleteCounts(items, undefined)).toEqual(items);
  });

  it("drops a bucket whose count is fully consumed by incomplete", () => {
    const items: [string, number][] = [
      ["freshman", 4],
      ["member", 6],
    ];
    const result = foldIncompleteCounts(items, { freshman: 4 });
    expect(result).toEqual([
      ["member", 6],
      [INCOMPLETE_BUCKET_KEY, 4],
    ]);
  });
});