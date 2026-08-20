import {
  addDays,
  pad2,
  toDateInputValue,
  toLocalInputValue,
  toLocalVisibleDay,
} from "./date-time";

describe("pad2", () => {
  it("zero-pads single digits", () => {
    expect(pad2(1)).toBe("01");
    expect(pad2(12)).toBe("12");
  });
});

describe("toLocalInputValue", () => {
  it("formats a local date as datetime-local value", () => {
    expect(toLocalInputValue(new Date(2026, 0, 2, 3, 4))).toBe("2026-01-02T03:04");
  });

  it("zero-pads month/day/hour/minute", () => {
    expect(toLocalInputValue(new Date(2026, 10, 5, 9, 7))).toBe("2026-11-05T09:07");
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
  it("returns the day for a start value", () => {
    expect(toLocalVisibleDay("2026-06-10T00:00")?.getDate()).toBe(10);
  });

  it("rolls back one day for end-of-day right-open boundary", () => {
    expect(toLocalVisibleDay("2026-06-16T00:00", true)?.getDate()).toBe(15);
  });

  it("rolls back across month boundary", () => {
    const day = toLocalVisibleDay("2026-07-01T00:00", true);
    expect(day?.getMonth()).toBe(5); // June
    expect(day?.getDate()).toBe(30);
  });

  it("handles empty values", () => {
    expect(toLocalVisibleDay(undefined)).toBeUndefined();
  });
});