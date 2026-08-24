import { z } from "zod/v3";

import { COLLEGES } from "@/lib/api/types";
import { realNameSchema } from "@/lib/validations/name";

/** Alumni provisioning request.
 *
 *  Rules mirror the backend's `validateCreate` (the same function the approval
 *  path runs) so a submission that passes here cannot be rejected for shape at
 *  approval time. Two rules are *stricter* than `POST /admin/users`, both forced
 *  by V010's generated `profile_needs_completion` column:
 *
 *  - `major` is required. The admin endpoint defaults it to "", which would flag
 *    the fresh account as incomplete and divert it to `/profile/complete`.
 *  - `name` must differ from `student_id`. The generated column compares them
 *    case-insensitively after trimming, so matching values flag the account too.
 */
export const alumniRequestSchema = z
  .object({
    name: realNameSchema,
    student_id: z
      .string()
      .trim()
      .min(1, "学号不可为空")
      .max(50, "学号最多 50 字符"),
    login_email: z
      .string()
      .trim()
      .email("请输入有效的邮箱")
      .max(255, "邮箱最多 255 字符")
      // Narrower than the backend on purpose. `validate.IsLoginEmailDomain` also
      // admits @sast.fun, but this channel exists for graduated members whose
      // *school* mailbox died, and the account identifier we want on file is the
      // one tied to their student identity. An @sast.fun address is issued by the
      // association, so anyone who has one can still be reached and does not need
      // this fallback. Relaxing this is a product decision, not a bug fix.
      .regex(/^[^\s@]+@njupt\.edu\.cn$/i, "仅支持 @njupt.edu.cn 学号邮箱"),
    personal_email: z
      .string()
      .trim()
      .min(1, "常用邮箱不可为空")
      .email("请输入有效的邮箱")
      .max(255, "邮箱最多 255 字符"),
    phone_number: z
      .string()
      .trim()
      .regex(/^1\d{10}$/, "请输入 11 位手机号"),
    qq_number: z
      .string()
      .trim()
      .regex(/^\d{5,20}$/, "请输入正确的 QQ 号"),
    college: z.enum(COLLEGES),
    // Required here, optional on POST /admin/users — see the V010 note above.
    major: z.string().trim().min(1, "专业不可为空").max(50, "专业最多 50 字符"),
    join_year: z
      .string()
      .trim()
      .min(1, "入会年份不可为空")
      // Deliberately stricter than the backend, which only bounds the length
      // (≤32 chars) and does not check the shape. A four-digit year is a
      // reasonable UI constraint; it just is not a server-side guarantee.
      .regex(/^(19|20)\d{2}$/, "请输入 4 位年份，如 2020"),
    department_note: z.string().trim().max(255, "最多 255 字符"),
    note: z.string().trim().max(1000, "最多 1000 字符"),
  })
  .superRefine((values, ctx) => {
    if (
      values.personal_email &&
      values.personal_email.toLowerCase() === values.login_email.toLowerCase()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["personal_email"],
        message: "常用邮箱不能与学号邮箱相同",
      });
    }
    // V010's generated column treats name == student_id as migration debris and
    // flags the account incomplete, so refuse it before it can be provisioned.
    if (
      values.name &&
      values.name.trim().toLowerCase() === values.student_id.trim().toLowerCase()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: "姓名不能与学号相同",
      });
    }
  });

export type AlumniRequestFormValues = z.infer<typeof alumniRequestSchema>;

export const alumniRejectSchema = z.object({
  reject_reason: z
    .string()
    .trim()
    .min(1, "请填写驳回理由")
    .max(500, "最多 500 字符"),
});

export type AlumniRejectFormValues = z.infer<typeof alumniRejectSchema>;
