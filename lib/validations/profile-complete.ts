import { z } from "zod/v3";

import { realNameSchema } from "@/lib/validations/name";

/**
 * Completion-page form: only the required profile fields the account is still
 * missing (name / phone_number / qq_number / major) are shown and validated.
 * These mirror the backend's `incomplete_fields` enum; the backend treats them
 * all alike (blank, or name equal to student_id).
 *
 * `name` may already hold a value that equals the student_id (legacy import
 * debris) — here it is required and re-submitted so the user replaces it with
 * a real name. phone / qq are blank for these accounts, so no empty-value
 * allowance is needed (unlike the general edit form).
 */
export const profileCompleteSchema = z.object({
  name: realNameSchema,
  phoneNumber: z
    .string()
    .trim()
    .regex(/^1\d{10}$/, "请输入 11 位手机号"),
  qqNumber: z
    .string()
    .trim()
    .regex(/^\d{5,20}$/, "请输入正确的 QQ 号"),
  major: z.string().trim().min(1, "专业不能为空").max(50),
});

export type ProfileCompleteFormValues = z.infer<typeof profileCompleteSchema>;
