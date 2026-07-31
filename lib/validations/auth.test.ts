import { loginAccountSchema, loginEmailSchema, passwordSchema, verificationCodeSchema } from "./auth";

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
});
