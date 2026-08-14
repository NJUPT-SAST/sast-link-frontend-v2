import { z } from "zod/v3";

const chineseNamePattern = /^\p{Script=Han}+$/u;

export const realNameSchema = z
  .string()
  .trim()
  .min(1, "姓名不能为空")
  .max(255)
  .regex(chineseNamePattern, "真实姓名仅限中文");
