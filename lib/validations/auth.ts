import { z } from "zod/v3";

import { realNameSchema } from "@/lib/validations/name";

import { COLLEGES } from "@/lib/api/types";

const studentIdPattern = /^[A-Za-z]\d{8}$/;
const emailPattern = /^[^\s@]+@(njupt\.edu\.cn|sast\.fun)$/i;
/** NJUPT student-mailbox prefix: one letter + eight digits, or bare eight
 *  digits. Mirrors backend PR #101 (`validate.IsNjuptEmailLocalAllowed`);
 *  @sast.fun prefixes stay free-form, and the backend judges the address
 *  lowercased, so both cases pass here. */
export const njuptEmailLocalPattern = /^(?:[A-Za-z]\d{8}|\d{8})$/;
const verificationCodePattern = /^\d{6}$/;
const passwordPattern = /^.{8,}$/;

export const loginAccountSchema = z
  .string()
  .trim()
  .min(1, "账户不可为空")
  .refine(
    (value) => studentIdPattern.test(value) || emailPattern.test(value),
    "请输入 9 位学号或登录邮箱",
  );

const loginPasswordSchema = z.string().min(1, "密码不可为空");

/** Password-reset identifier: the account's `login_email` OR any bound
 *  `other_mail` personal identity. The backend resolves the account by login
 *  identifier and sends the code to this submitted mailbox, so any reachable
 *  email is acceptable — not just the registration whitelist domains. */
export const resetEmailSchema = z
  .string()
  .trim()
  .min(1, "邮箱不可为空")
  .email("请输入正确的邮箱");

const registerAccountFormSchema = z.object({
  account: z
    .object({
      localPart: z.string().trim(),
      domain: z.enum(["@njupt.edu.cn", "@sast.fun"]),
    })
    .superRefine(({ localPart, domain }, ctx) => {
      if (localPart.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "账户不可为空",
          path: ["localPart"],
        });
        return;
      }
      if (localPart.includes("@")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "邮箱前缀不能包含 @",
          path: ["localPart"],
        });
        return;
      }
      // The student mailbox prefix is the student ID (backend PR #101): every
      // login_email write path refuses other shapes with 40022, so rejecting
      // here keeps the request from ever leaving.
      if (domain === "@njupt.edu.cn" && !njuptEmailLocalPattern.test(localPart)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "@njupt.edu.cn 前缀须为学号样式：1 位字母 + 8 位数字或纯 8 位数字",
          path: ["localPart"],
        });
      }
    }),
});

export const verificationCodeSchema = z
  .string()
  .trim()
  .regex(verificationCodePattern, "请输入 6 位验证码");

export const passwordSchema = z
  .string()
  .regex(passwordPattern, "密码至少 8 位");

export const registerDetailsSchema = z
  .object({
    nickname: z.string().trim().min(1, "昵称不可为空").max(255, "昵称最多 255 个字符"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请确认密码"),
    name: realNameSchema,
    phoneNumber: z
      .string()
      .trim()
      .regex(/^1\d{10}$/, "请输入 11 位手机号"),
    qqNumber: z
      .string()
      .trim()
      .regex(/^\d{5,20}$/, "请输入正确的 QQ 号"),
    college: z.enum(COLLEGES),
    major: z.string().trim().min(1, "专业不可为空").max(50),
    studentId: z.string().trim().max(50).regex(studentIdPattern, "请输入正确的学号"),
    // Explicit consent to the privacy policy and terms of service. zod/v3's
    // z.literal() ignores a custom message, so refine() carries the copy the
    // user actually sees.
    agreedToTerms: z
      .boolean()
      .refine((v) => v === true, "请阅读并同意《用户协议》与《隐私政策》"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "密码不一致",
    path: ["confirmPassword"],
  });

export const resetPasswordFormSchema = z
  .object({
    code: verificationCodeSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "密码不一致",
    path: ["confirmPassword"],
  });

export const loginAccountFormSchema = z.object({
  account: z
    .object({
      localPart: z.string().trim(),
      domain: z.enum(["@njupt.edu.cn", "@sast.fun", "其他邮箱"]),
    })
    .superRefine(({ localPart, domain }, ctx) => {
      if (localPart.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "账户不可为空",
          path: ["localPart"],
        });
        return;
      }
      if (domain === "其他邮箱") {
        // An other_mail identity can be any address the user bound (qq, gmail…),
        // so only shape is checked here — the domain allow-list applies to
        // registration, not to logging in with an already-bound other_mail.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localPart)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "请输入完整的邮箱地址",
            path: ["localPart"],
          });
        }
        return;
      }
      if (localPart.includes("@")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "邮箱前缀不能包含 @",
          path: ["localPart"],
        });
      }
    }),
});
export const loginPasswordFormSchema = z.object({ password: loginPasswordSchema });

export type LoginAccountFormValues = z.infer<typeof loginAccountFormSchema>;
export type LoginPasswordFormValues = z.infer<typeof loginPasswordFormSchema>;
export type RegisterDetailsFormValues = z.infer<typeof registerDetailsSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export const registerVerifyFormSchema = z.object({
  account: registerAccountFormSchema.shape.account,
  code: verificationCodeSchema,
});
export type RegisterVerifyFormValues = z.infer<typeof registerVerifyFormSchema>;
