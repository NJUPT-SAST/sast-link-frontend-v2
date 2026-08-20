import {
  addDays,
  pad2,
  toDateInputValue,
  toLocalVisibleDay,
  toRfc3339Local,
} from "./date-time";

describe("pad2", () => {
  it("zero-pads single digits", () => {
    expect(pad2(1)).toBe("01");
    expect(pad2(12)).toBe("12");
  });
});

describe("toRfc3339Local", () => {
  it("formats local time as RFC 3339 with seconds and a zone offset", () => {
    const value = toRfc3339Local(new Date(2026, 0, 2, 3, 4, 0));
    // 秒必须存在，且带 [+-]HH:MM 偏移；偏移值取决于运行时区
    expect(value).toMatch(/^2026-01-02T03:04:00[+-]\d{2}:\d{2}$/);
  });
});

describe("toDateInputValue", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(toDateInputValue(new Date(2026, 5, 15))).toBe("2026-06-15");
  });
});

describe("addDays", () => {
  it("spans month boundaries", () => {
    expect(addDays(new Date(2026, 5, 30), 1).getDate()).toBe(1);
    expect(addDays(new Date(2026, 5, 30), 1).getMonth()).toBe(6);
  });
});

describe("toLocalVisibleDay", () => {
  it("reads the date directly from the RFC3339 string (timezone-agnostic)", () => {
    expect(toLocalVisibleDay("2026-06-10T00:00:00+08:00")?.getDate()).toBe(10);
    // 即使是不同 offset / UTC，也只取字符串里的日期段，不入浏览器时区折算
    expect(toLocalVisibleDay("2026-06-10T00:00:00Z")?.getDate()).toBe(10);
  });

  it("rolls back one day for end-of-day right-open boundary", () => {
    expect(toLocalVisibleDay("2026-06-16T00:00:00+08:00", true)?.getDate()).toBe(15);
  });

  it("rolls back across month boundary", () => {
    const day = toLocalVisibleDay("2026-07-01T00:00:00+08:00", true);
    expect(day?.getMonth()).toBe(5); // June
    expect(day?.getDate()).toBe(30);
  });

  it("handles empty or malformed values", () => {
    expect(toLocalVisibleDay(undefined)).toBeUndefined();
    expect(toLocalVisibleDay("nonsense")).toBeUndefined();
  });
});