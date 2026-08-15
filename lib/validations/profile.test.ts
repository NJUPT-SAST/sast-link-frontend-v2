import { profileEditSchema, profileRules } from "./profile";

type PatternRule = { value: RegExp; message: string };
const pattern = (value: unknown) => value as PatternRule;

describe("profileRules", () => {
  it("matches OpenAPI profile length limits", () => {
    expect(profileRules.nickname.maxLength).toEqual({
      value: 255,
      message: "昵称最多 255 个字符",
    });
    expect(profileRules.intro.maxLength).toEqual({
      value: 255,
      message: "签名最多 255 个字符",
    });
  });

  it("accepts empty, protocol-less or http links and rejects invalid links", () => {
    for (const rule of [profileRules.blogUrl, profileRules.githubUrl]) {
      const regex = pattern(rule.pattern).value;
      expect(regex.test("")).toBe(true);
      expect(regex.test("https://example.com")).toBe(true);
      expect(regex.test("https://example.com/path")).toBe(true);
      expect(regex.test("example.com")).toBe(true);
      expect(regex.test("github.com/alice")).toBe(true);
      expect(regex.test("https://")).toBe(false);
      expect(regex.test("not-a-url")).toBe(false);
      expect(regex.test("abc")).toBe(false);
    }
  });
});

describe("profileEditSchema", () => {
  const valid = {
    nickname: "Alice",
    name: "张三",
    intro: "hello world",
    phoneNumber: "13800138000",
    qqNumber: "123456789",
    college: "计算机学院、软件学院、网络空间安全学院",
    major: "软件工程",
    department: "software",
    blogUrl: "https://blog.example.com",
    githubUrl: "https://github.com/alice",
  };

  it("accepts a fully populated profile", () => {
    expect(profileEditSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts protocol-less urls (the https:// prefix is re-added on submit)", () => {
    const data = { ...valid, blogUrl: "blog.example.com", githubUrl: "github.com/alice" };
    expect(profileEditSchema.safeParse(data).success).toBe(true);
  });

  it("accepts empty optional fields", () => {
    const data = {
      ...valid,
      phoneNumber: "",
      qqNumber: "",
      department: "",
      blogUrl: "",
      githubUrl: "",
    };
    expect(profileEditSchema.safeParse(data).success).toBe(true);
  });

  it("rejects empty nickname", () => {
    const r = profileEditSchema.safeParse({ ...valid, nickname: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("nickname"))).toBe(true);
    }
  });

  it("rejects empty name", () => {
    const r = profileEditSchema.safeParse({ ...valid, name: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("name"))).toBe(true);
    }
  });

  it("rejects invalid phone number", () => {
    const r = profileEditSchema.safeParse({ ...valid, phoneNumber: "123" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("phoneNumber"))).toBe(true);
    }
  });

  it("rejects invalid QQ number", () => {
    const r = profileEditSchema.safeParse({ ...valid, qqNumber: "abc" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("qqNumber"))).toBe(true);
    }
  });

  it("rejects invalid college", () => {
    const r = profileEditSchema.safeParse({ ...valid, college: "火星学院" });
    expect(r.success).toBe(false);
  });

  it("rejects malformed absolute urls", () => {
    const r = profileEditSchema.safeParse({ ...valid, blogUrl: "https://" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid blogUrl", () => {
    const r = profileEditSchema.safeParse({ ...valid, blogUrl: "not-a-url" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("blogUrl"))).toBe(true);
    }
  });

  it("rejects blank major", () => {
    const r = profileEditSchema.safeParse({ ...valid, major: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("major"))).toBe(true);
    }
  });
});
