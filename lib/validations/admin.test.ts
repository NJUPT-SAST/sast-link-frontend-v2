import { adminAuditLogFiltersSchema } from "./admin";

const base = { page: 1, page_size: 20 };

describe("adminAuditLogFiltersSchema", () => {
  it("allows an empty user_id alongside other filters", () => {
    const result = adminAuditLogFiltersSchema.safeParse({
      ...base,
      user_id: "",
      action: "login",
      resource: "user",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a numeric user_id and converts nothing", () => {
    const result = adminAuditLogFiltersSchema.safeParse({ ...base, user_id: "42" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.user_id).toBe("42");
  });

  it("rejects a non-numeric user_id with a hint", () => {
    const result = adminAuditLogFiltersSchema.safeParse({ ...base, user_id: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("请输入有效的数字");
    }
  });

  it("accepts valid start/end time ranges", () => {
    const result = adminAuditLogFiltersSchema.safeParse({
      ...base,
      start_time: "2026-08-01T00:00",
      end_time: "2026-08-10T23:59",
    });
    expect(result.success).toBe(true);
  });

  it("rejects start_time later than end_time", () => {
    const result = adminAuditLogFiltersSchema.safeParse({
      ...base,
      start_time: "2026-08-10T00:00",
      end_time: "2026-08-01T00:00",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("end_time"))).toBe(true);
      expect(result.error.issues.some((i) => i.message.includes("开始时间"))).toBe(true);
    }
  });

  it("allows a time range with only one bound set", () => {
    expect(
      adminAuditLogFiltersSchema.safeParse({ ...base, start_time: "2026-08-01T00:00" }).success,
    ).toBe(true);
    expect(
      adminAuditLogFiltersSchema.safeParse({ ...base, end_time: "2026-08-01T00:00" }).success,
    ).toBe(true);
  });
});
