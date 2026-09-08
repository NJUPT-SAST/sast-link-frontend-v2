import { z } from "zod/v3";

/**
 * 专业（major）校验，补全页与通用编辑页共用。
 *
 * 后端契约：`PUT /user/profile` 的必填字段检查 = 空白 / 超长（50 字符）/
 * C0/C1 控制字符（`validate.HasControlCharacter`，可见字符范围之外的
 * U+0001-U+001F、U+007F、U+0080-U+009F）。判定侧（`profile_needs_completion`
 * 生成列，V010 初建 / V015 重建）与写路径同源，所以任何「待补全」字段都
 * 带着一个编辑会被拒绝的值——本 schema 必须在请求发出前拒绝同样的形状，
 * 否则控制字符会穿透到后端 400，而用户在输入框里看不见问题出在哪。
 *
 * 与 `lib/validations/name.ts` 的关系：name 的 `realNameSchema` 以字符集
 * （仅汉字与间隔号）同时覆盖空白 / 超长 / 控制字符；phone / qq 的数字
 * 正则同样覆盖。major 没有字符集约束，只有这里显式的三道检查。
 */
export const majorSchema = z
  .string()
  .trim()
  .min(1, "专业不能为空")
  .max(50, "专业最多 50 个字符")
  .refine((value) => !/[\u0000-\u001f\u007f\u0080-\u009f]/.test(value), {
    message: "输入值非法",
  });