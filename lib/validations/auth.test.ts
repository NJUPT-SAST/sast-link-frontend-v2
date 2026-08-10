import {
  loginAccountFormSchema,
  loginAccountSchema,
  loginEmailSchema,
  passwordSchema,
  registerDetailsSchema,
  verificationCodeSchema,
} from "./auth";

describe("auth validation schemas", () => {
  it("accepts student ids and supported login emails", () => {
    expect(loginAccountSchema.safeParse("B12345678").success).toBe(true);
    expect(loginAccountSchema.safeParse("student@njupt.edu.cn").success).toBe(true);
    expect(loginEmailSchema.safeParse("member@sast.fun").success).toBe(true);
    expect(loginEmailSchema.safeParse("user@example.com").success).toBe(false);
  });

  it("requires six-digit codes and passwords of at least 8 characters", () => {
    expect(verificationCodeSchema.safeParse("123456").success).toBe(true);
    expect(verificationCodeSchema.safeParse("12345").success).toBe(false);
    expect(passwordSchema.safeParse("Password123").success).toBe(true);
    expect(passwordSchema.safeParse("password").success).toBe(true);
    expect(passwordSchema.safeParse("passwor").success).toBe(false);
  });

  describe("loginAccountFormSchema", () => {
    const valid = (localPart: string, domain = "@njupt.edu.cn") => ({
      account: { localPart, domain },
    });

    it("accepts supported domains in the other-email branch", () => {
      expect(loginAccountFormSchema.safeParse(valid("alice@sast.fun", "其他邮箱")).success).toBe(true);
      expect(loginAccountFormSchema.safeParse(valid("alice@njupt.edu.cn", "其他邮箱")).success).toBe(true);
    });

    it("rejects unsupported emails in the other-email branch", () => {
      const result = loginAccountFormSchema.safeParse(valid("alice@example.com", "其他邮箱"));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("仅支持 @njupt.edu.cn 或 @sast.fun 邮箱");
      }
    });
  });

  describe("registerDetailsSchema", () => {
    const valid = {
      nickname: "Alice",
      password: "Password123",
      confirmPassword: "Password123",
      name: "爱丽丝",
      phoneNumber: "13800138000",
      qqNumber: "1234567890",
      college: "计算机学院、软件学院、网络空间安全学院",
      major: "软件工程",
      studentId: "B24040001",
    };

    it("accepts empty optional phone and qq", () => {
      expect(registerDetailsSchema.safeParse({ ...valid, phoneNumber: "", qqNumber: "" }).success).toBe(true);
    });

    it("still rejects malformed phone and qq", () => {
      const phone = registerDetailsSchema.safeParse({ ...valid, phoneNumber: "123" });
      expect(phone.success).toBe(false);
      if (!phone.success) {
        expect(phone.error.issues.some((i) => i.path.includes("phoneNumber"))).toBe(true);
      }
      const qq = registerDetailsSchema.safeParse({ ...valid, qqNumber: "abc" });
      expect(qq.success).toBe(false);
      if (!qq.success) {
        expect(qq.error.issues.some((i) => i.path.includes("qqNumber"))).toBe(true);
      }
    });
  });
});
