import { z } from "zod/v3";

import { realNameSchema } from "@/lib/validations/name";
import { majorSchema } from "@/lib/validations/major";

/**
 * Completion-page form: only the required profile fields the account is still
 * missing (name / phone_number / qq_number / major) are shown and validated.
 * These mirror the backend's `incomplete_fields` enum.
 *
 * Backend contract (V010 initial, V015 rebuilt): `profile_needs_completion` is
 * TRUE while a required field is blank, over-long or holds a C0/C1 control
 * character, or `name` equals `student_id` — exactly the shapes
 * `PUT /user/profile` refuses. So a field reaching this page always carries a
 * value an edit would reject, and the schema below must refuse the same shapes
 * before the request is sent (a control character the page accepted would come
 * back as a 400 the user cannot see the cause of).
 *
 * `name` may already hold a value that equals the student_id (legacy import
 * debris) or carries invisible control characters — here it is required and
 * re-submitted so the user replaces it with a real name. phone / qq are blank
 * for these accounts, so no empty-value allowance is needed (unlike the
 * general edit form).
 *
 * Validation coverage against the backend rule:
 * - name: `realNameSchema` restricts the character set to Han + interpuncts,
 *   so blank, over-long and control-character values are all refused here.
 * - phone / qq: the digit regexes refuse blank, over-long and control
 *   characters.
 * - major: `majorSchema` below refuses blank, over-long and control-character
 *   values — the one field whose regex-free min/max checks alone would let an
 *   invisible control character through to a backend 400.
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
  major: majorSchema,
});

export type ProfileCompleteFormValues = z.infer<typeof profileCompleteSchema>;