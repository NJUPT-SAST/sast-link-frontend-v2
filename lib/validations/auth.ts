import { z } from "zod/v3";

import { COLLEGES } from "@/lib/api/types";

const studentIdPattern = /^[A-Za-z]\d{8}$/;
const emailPattern = /^[^\s@]+@(njupt\.edu\.cn|sast\.fun)$/i;
const verificationCodePattern = /^\d{6}$/;
const strongPasswordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const loginAccountSchema = z
  .string()
  .trim()
  .min(1, "账户不可为空")
  .refine(
    (value) => studentIdPattern.test(value) || emailPattern.test(value),
    "请输入 9 位学号或登录邮箱",
  );

export const loginPasswordSchema = z.string().min(1, "密码不可为空");

export const loginEmailSchema = z
  .string()
  .trim()
  .email("请输入正确的邮箱")
  .regex(emailPattern, "仅支持 @njupt.edu.cn 或 @sast.fun 邮箱");

export const registerAccountFormSchema = z.object({
  loginEmail: loginEmailSchema,
});

export const verificationCodeSchema = z
  .string()
  .trim()
  .regex(verificationCodePattern, "请输入 6 位验证码");

export const passwordSchema = z
  .string()
  .regex(strongPasswordPattern, "密码至少 8 位且需同时包含字母和数字");

export const registerDetailsSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请确认密码"),
    name: z.string().trim().min(1, "姓名不可为空").max(255),
    phoneNumber: z.string().trim().regex(/^1\d{10}$/, "请输入 11 位手机号"),
    qqNumber: z.string().trim().regex(/^\d{5,20}$/, "请输入正确的 QQ 号"),
    college: z.enum(COLLEGES),
    major: z.string().trim().min(1, "专业不可为空").max(50),
    studentId: z.string().trim().max(50).regex(studentIdPattern, "请输入正确的学号"),
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
      if (domain === "@njupt.edu.cn" && localPart.includes("@")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "邮箱前缀不能包含 @",
          path: ["localPart"],
        });
      }
      if (domain === "@sast.fun" && localPart.includes("@")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "邮箱前缀不能包含 @",
          path: ["localPart"],
        });
      }
    }),
});
export const loginPasswordFormSchema = z.object({ password: loginPasswordSchema });
export const verificationCodeFormSchema = z.object({ captcha: verificationCodeSchema });

export type LoginAccountFormValues = z.infer<typeof loginAccountFormSchema>;
export type LoginPasswordFormValues = z.infer<typeof loginPasswordFormSchema>;
export type RegisterAccountFormValues = z.infer<typeof registerAccountFormSchema>;
export type VerificationCodeFormValues = z.infer<typeof verificationCodeFormSchema>;
export type RegisterDetailsFormValues = z.infer<typeof registerDetailsSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export function studentIdToEmail(studentId: string) {
  return `${studentId.trim()}@njupt.edu.cn`;
}
