import { getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("returns 早上好 in the morning", () => {
    expect(getGreeting(6)).toBe("早上好");
    expect(getGreeting(11)).toBe("早上好");
  });

  it("returns 下午好 in the afternoon", () => {
    expect(getGreeting(12)).toBe("下午好");
    expect(getGreeting(17)).toBe("下午好");
  });

  it("returns 晚上好 in the evening", () => {
    expect(getGreeting(18)).toBe("晚上好");
    expect(getGreeting(23)).toBe("晚上好");
  });

  it("returns 夜深了 before dawn", () => {
    expect(getGreeting(0)).toBe("夜深了");
    expect(getGreeting(5)).toBe("夜深了");
  });
});
