import { z } from "zod/v3";

/**
 * 真实姓名校验（民委发〔2016〕33号文对齐，仅支持中文姓名）。
 *
 * 字符集：
 * - `\p{Script=Han}`：汉字全覆盖（含扩展区生僻字，如 𠮷）
 * - 间隔号 U+00B7（·）：少数民族姓名标准间隔符（GB13000 00B7）
 * - 常见间隔号变体（U+30FB・/U+FF65･/U+2027‧/U+0387·）：历史数据里常见，
 *   存储前归一化为 U+00B7
 *
 * 产品边界：不接收外籍姓名/拉丁字母/空格（南邮中国学生场景）；如未来需要
 * 外籍支持，需同步放宽字符集与后端校验。
 */
const realNamePattern = /^[\p{Script=Han}\u00B7\u30FB\uFF65\u2027\u0387]+$/u;

const INTERPUNCT_VARIANTS = /[\u30FB\uFF65\u2027\u0387]/g;

export const realNameSchema = z
  .string()
  .trim()
  .min(1, "姓名不能为空")
  .max(255, "姓名最多 255 个字符")
  .regex(realNamePattern, "姓名仅限中文与间隔号（·）")
  .transform((name) => name.replace(INTERPUNCT_VARIANTS, "·"));
