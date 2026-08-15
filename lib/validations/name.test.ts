import { realNameSchema } from "./name";

describe("realNameSchema", () => {
  it("accepts Chinese names, including rare extension-plane characters", () => {
    expect(realNameSchema.safeParse("张三").success).toBe(true);
    // 扩展 B 区生僻字（surrogate pair）
    expect(realNameSchema.safeParse("𠮷野").success).toBe(true);
  });

  it("accepts ethnic minority names with the standard interpunct U+00B7", () => {
    expect(realNameSchema.safeParse("迪丽热巴·买买提").success).toBe(true);
    // 长名字：民委发〔2016〕33号文要求的 50 字符容量场景
    expect(realNameSchema.safeParse("阿不都热合曼·阿不都热合曼").success).toBe(true);
  });

  it("rejects foreign names using Latin letters", () => {
    expect(realNameSchema.safeParse("Alice").success).toBe(false);
    expect(realNameSchema.safeParse("José María García").success).toBe(false);
    expect(realNameSchema.safeParse("O'Brien").success).toBe(false);
    expect(realNameSchema.safeParse("Jean-Pierre").success).toBe(false);
    expect(realNameSchema.safeParse("Aïcha").success).toBe(false);
    expect(realNameSchema.safeParse("张 三").success).toBe(false);
  });

  it("normalizes interpunct variants to U+00B7", () => {
    // U+30FB（日文中点）、U+FF65（半角片假名中点）、U+2027、U+0387
    for (const variant of ["・", "･", "‧", "·"]) {
      const r = realNameSchema.safeParse(`迪丽热巴${variant}买买提`);
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data).toBe("迪丽热巴·买买提");
      }
    }
  });

  it("trims surrounding whitespace", () => {
    const r = realNameSchema.safeParse("  张三  ");
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toBe("张三");
    }
  });

  it("rejects empty names", () => {
    expect(realNameSchema.safeParse("").success).toBe(false);
    expect(realNameSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects non-name characters", () => {
    expect(realNameSchema.safeParse("张三1").success).toBe(false);
    expect(realNameSchema.safeParse("张_三").success).toBe(false);
    expect(realNameSchema.safeParse("张三👋").success).toBe(false);
    expect(realNameSchema.safeParse("张\n三").success).toBe(false);
    expect(realNameSchema.safeParse("<script>").success).toBe(false);
    expect(realNameSchema.safeParse("张三（测试）").success).toBe(false);
    expect(realNameSchema.safeParse("Alice").success).toBe(false);
  });

  it("rejects names longer than 255 characters", () => {
    expect(realNameSchema.safeParse("张".repeat(256)).success).toBe(false);
    expect(realNameSchema.safeParse("张".repeat(255)).success).toBe(true);
  });
});
