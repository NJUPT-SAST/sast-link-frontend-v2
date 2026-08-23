import {
  adminAuditLogFiltersSchema,
  adminCreateUserSchema,
  adminOAuthClientSchema,
  adminUpdateUserSchema,
} from "./admin";

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

describe("adminOAuthClientSchema", () => {
  const client = {
    client_name: "Evento",
    client_type: "third_party" as const,
    redirect_uris: ["https://evento.sast.fun/callback"],
    grant_types: ["authorization_code"] as const,
    scopes: ["openid", "profile"] as const,
    is_active: true,
  };

  it("allows admin scopes on a third_party client", () => {
    const result = adminOAuthClientSchema.safeParse({
      ...client,
      scopes: ["openid", "admin:read"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects admin scopes on a first_party client", () => {
    const result = adminOAuthClientSchema.safeParse({
      ...client,
      client_type: "first_party",
      scopes: ["openid", "admin:write"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join(".") === "scopes");
      expect(issue?.message).toBe("admin scope 仅可授予 third_party 客户端");
    }
  });

  it("allows user scopes on any client type", () => {
    expect(
      adminOAuthClientSchema.safeParse({
        ...client,
        client_type: "first_party",
        scopes: ["openid", "user:read"],
      }).success,
    ).toBe(true);
  });
});

describe("adminUpdateUserSchema", () => {
  const base = { name: "张三" };

  it("rejects a blank phone_number like other required fields", () => {
    const result = adminUpdateUserSchema.safeParse({ ...base, phone_number: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "phone_number");
      expect(issue?.message).toBe("手机号不可为空");
    }
  });

  it("treats a whitespace-only phone_number as blank", () => {
    const result = adminUpdateUserSchema.safeParse({ ...base, phone_number: "   " });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "phone_number");
      expect(issue?.message).toBe("手机号不可为空");
    }
  });

  it("rejects a malformed phone_number with the format hint", () => {
    const result = adminUpdateUserSchema.safeParse({ ...base, phone_number: "1380013800" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "phone_number");
      expect(issue?.message).toBe("请输入 11 位手机号");
    }
  });

  it("accepts a valid phone_number", () => {
    const result = adminUpdateUserSchema.safeParse({ ...base, phone_number: "13800138000" });
    expect(result.success).toBe(true);
  });

  it("rejects a blank qq_number like other required fields", () => {
    const result = adminUpdateUserSchema.safeParse({ ...base, qq_number: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "qq_number");
      expect(issue?.message).toBe("QQ 号不可为空");
    }
  });

  it("rejects a malformed qq_number", () => {
    const result = adminUpdateUserSchema.safeParse({ ...base, qq_number: "1234" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "qq_number");
      expect(issue?.message).toBe("请输入正确的 QQ 号");
    }
  });

  it("accepts a valid qq_number", () => {
    const result = adminUpdateUserSchema.safeParse({ ...base, qq_number: "123456789" });
    expect(result.success).toBe(true);
  });

  it("still allows omitting phone_number/qq_number for a partial update", () => {
    expect(adminUpdateUserSchema.safeParse({ name: "李四" }).success).toBe(true);
  });
});

describe("adminCreateUserSchema", () => {
  const base = {
    name: "张三",
    phone_number: "13800138000",
    qq_number: "12345",
    student_id: "B24040525",
    login_email: "b24040525@njupt.edu.cn",
    college: "其他",
    major: "",
    personal_email: "",
    role: "member",
    state: "retired_sast",
  };

  it("accepts a complete provisioning request with a bound personal email", () => {
    const result = adminCreateUserSchema.safeParse({
      ...base,
      personal_email: "zhangsan@qq.com",
    });
    expect(result.success).toBe(true);
  });

  it("restricts login_email to the registration whitelist domains", () => {
    expect(adminCreateUserSchema.safeParse({ ...base, login_email: "a@qq.com" }).success).toBe(false);
    expect(adminCreateUserSchema.safeParse({ ...base, login_email: "a@njupt.edu.cn" }).success).toBe(true);
    expect(adminCreateUserSchema.safeParse({ ...base, login_email: "a@SAST.FUN" }).success).toBe(true);
  });

  it("rejects is_deleted as a creation state", () => {
    expect(adminCreateUserSchema.safeParse({ ...base, state: "is_deleted" }).success).toBe(false);
    expect(adminCreateUserSchema.safeParse({ ...base, state: "on_sast" }).success).toBe(true);
  });

  it("allows an empty personal_email (no bound identity)", () => {
    expect(adminCreateUserSchema.safeParse(base).success).toBe(true);
  });

  it("rejects personal_email identical to login_email", () => {
    const result = adminCreateUserSchema.safeParse({
      ...base,
      personal_email: "B24040525@njupt.edu.cn",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "personal_email");
      expect(issue?.message).toBe("个人邮箱不能与登录邮箱相同");
    }
  });

  it("rejects a malformed personal_email", () => {
    expect(adminCreateUserSchema.safeParse({ ...base, personal_email: "not-an-email" }).success).toBe(false);
  });

  it("requires the mandatory provisioning fields", () => {
    expect(adminCreateUserSchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(adminCreateUserSchema.safeParse({ ...base, student_id: "" }).success).toBe(false);
    expect(adminCreateUserSchema.safeParse({ ...base, phone_number: "123" }).success).toBe(false);
    expect(adminCreateUserSchema.safeParse({ ...base, qq_number: "12" }).success).toBe(false);
  });
});
