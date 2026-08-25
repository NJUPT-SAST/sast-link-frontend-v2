import {
  alumniRejectSchema,
  alumniRequestSchema,
} from "@/lib/validations/alumni";

function validValues() {
  return {
    name: "张三",
    student_id: "B18040101",
    login_email: "b18040101@njupt.edu.cn",
    personal_email: "zhangsan@qq.com",
    phone_number: "13800000001",
    qq_number: "100001",
    college: "其他" as const,
    major: "软件工程",
    join_year: "2018",
    department_note: "",
    note: "",
  };
}

describe("alumniRequestSchema", () => {
  it("accepts a complete request", () => {
    expect(alumniRequestSchema.safeParse(validValues()).success).toBe(true);
  });

  // V010's generated profile_needs_completion column flags a blank major, which
  // would divert the provisioned account to /profile/complete on first login.
  it("requires major", () => {
    const result = alumniRequestSchema.safeParse({ ...validValues(), major: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "major")).toBe(true);
    }
  });

  // Same generated column treats name == student_id as migration debris. In
  // practice realNameSchema already refuses a latin-letter student id, so this
  // asserts the specific V010 message on an all-CJK collision — the only shape
  // that can reach the superRefine at all. Kept because the backend compares the
  // two fields regardless of script, and a future relaxation of realNameSchema
  // (e.g. to admit non-Chinese names) would otherwise silently open the hole.
  it("rejects a name equal to the student id", () => {
    const result = alumniRequestSchema.safeParse({
      ...validValues(),
      name: "张三",
      student_id: "张三",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === "姓名不能与学号相同"),
      ).toBe(true);
    }
  });

  it("restricts login_email to the registration whitelist", () => {
    const result = alumniRequestSchema.safeParse({
      ...validValues(),
      login_email: "someone@qq.com",
    });
    expect(result.success).toBe(false);
  });

  // Narrower than the backend, which also admits @sast.fun. This channel is for
  // members whose school mailbox died; an association-issued address still works,
  // so its holder does not need the fallback.
  it("rejects an @sast.fun login_email", () => {
    const result = alumniRequestSchema.safeParse({
      ...validValues(),
      login_email: "alumni@sast.fun",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "login_email"),
      ).toBe(true);
    }
  });

  it("accepts an @njupt.edu.cn login_email regardless of case", () => {
    expect(
      alumniRequestSchema.safeParse({
        ...validValues(),
        login_email: "B18040101@NJUPT.EDU.CN",
        personal_email: "elsewhere@qq.com",
      }).success,
    ).toBe(true);
  });

  it("accepts any domain for personal_email", () => {
    expect(
      alumniRequestSchema.safeParse({
        ...validValues(),
        personal_email: "alum@gmail.com",
      }).success,
    ).toBe(true);
  });

  it("rejects a personal_email identical to login_email", () => {
    const result = alumniRequestSchema.safeParse({
      ...validValues(),
      personal_email: "B18040101@NJUPT.EDU.CN",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "personal_email"),
      ).toBe(true);
    }
  });

  it("requires a four-digit join year", () => {
    expect(
      alumniRequestSchema.safeParse({ ...validValues(), join_year: "18" }).success,
    ).toBe(false);
  });

  it("rejects a malformed phone number", () => {
    expect(
      alumniRequestSchema.safeParse({ ...validValues(), phone_number: "1380000" }).success,
    ).toBe(false);
  });
});

describe("alumniRejectSchema", () => {
  it("requires a reason", () => {
    expect(alumniRejectSchema.safeParse({ reject_reason: "   " }).success).toBe(false);
  });

  it("accepts a reason", () => {
    expect(
      alumniRejectSchema.safeParse({ reject_reason: "档案中未找到该学号" }).success,
    ).toBe(true);
  });
});
