import { z } from "zod/v3";

import { COLLEGES, CREATE_USER_STATES } from "@/lib/api/types";

function isValidRedirectUri(value: string): boolean {
  if (value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (url.hash) return false;
    if (url.username || url.password) return false;
    if (url.protocol === "https:") return true;
    if (url.protocol === "http:") {
      const host = url.hostname.toLowerCase();
      return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    }
    return false;
  } catch {
    return false;
  }
}

const redirectUriSchema = z
  .string()
  .trim()
  .min(1, "回调地址不可为空")
  .max(2048, "回调地址最长 2048 字符")
  .refine(isValidRedirectUri, "必须是 https，或 http + localhost/127.0.0.1，且不能含 fragment/userinfo");

const userRoleSchema = z.enum(["freshman", "member", "lecturer", "admin"]);
const userStateSchema = z.enum(["njupter", "on_sast", "retired_sast", "is_deleted"]);
const departmentSchema = z.enum([
  "software",
  "media",
  "electronics",
  "office",
  "publicity",
  "outreach",
]);
const emailTypeSchema = z.enum(["njupt_email", "sast_email"]);
const grantTypeSchema = z.enum(["authorization_code", "refresh_token"]);
const scopeSchema = z.enum(["openid", "profile", "email", "admin:read", "admin:write", "user:read", "user:write"]);

export const adminUserFiltersSchema = z.object({
  page: z.coerce.number().int().min(1),
  page_size: z.coerce.number().int().min(1).max(100),
  role: userRoleSchema.optional().or(z.literal("")),
  state: userStateSchema.optional().or(z.literal("")),
  department: departmentSchema.optional().or(z.literal("")),
  student_id: z.string().trim().optional(),
  keyword: z.string().trim().optional(),
  /** Tri-state: "" = no filter (all), "true" = only accounts still needing
   *  completion, "false" = only complete accounts. */
  needs_completion: z.enum(["", "true", "false"]).optional(),
});

export type AdminUserFiltersFormValues = z.infer<typeof adminUserFiltersSchema>;

export const adminUpdateUserSchema = z
  .object({
    name: z.string().trim().min(1, "姓名不可为空").max(255).optional(),
    phone_number: z
      .string()
      .trim()
      .min(1, "手机号不可为空")
      .regex(/^1\d{10}$/, "请输入 11 位手机号")
      .optional(),
    qq_number: z
      .string()
      .trim()
      .min(1, "QQ 号不可为空")
      .regex(/^\d{5,20}$/, "请输入正确的 QQ 号")
      .optional(),
    college: z.enum(COLLEGES).optional(),
    major: z.string().trim().min(1, "专业不可为空").max(50).optional(),
    student_id: z.string().trim().min(1, "学号不可为空").max(50).optional(),
    login_email: z.string().trim().email("请输入有效的邮箱").max(255).optional(),
    role: userRoleSchema.optional(),
    state: userStateSchema.optional(),
    email_type: emailTypeSchema.optional(),
  })
  .refine((values) => Object.keys(values).length > 0, "至少修改一个字段");

export type AdminUpdateUserFormValues = z.infer<typeof adminUpdateUserSchema>;

/** Create user (admin provisioning) — mirrors the registration whitelist for
 *  `login_email` (email_type is derived server-side), lets `personal_email`
 *  stay empty (no bound identity), and never accepts `state: is_deleted`. */
export const adminCreateUserSchema = z
  .object({
    name: z.string().trim().min(1, "姓名不可为空").max(255, "姓名最多 255 字符"),
    student_id: z
      .string()
      .trim()
      .min(1, "学号不可为空")
      .max(50, "学号最多 50 字符"),
    college: z.enum(COLLEGES),
    major: z.string().trim().max(50, "专业最多 50 字符"),
    login_email: z
      .string()
      .trim()
      .email("请输入有效的邮箱")
      .max(255, "邮箱最多 255 字符")
      .regex(
        /^[^\s@]+@(njupt\.edu\.cn|sast\.fun)$/i,
        "仅支持 @njupt.edu.cn 或 @sast.fun 邮箱",
      ),
    phone_number: z
      .string()
      .trim()
      .regex(/^1\d{10}$/, "请输入 11 位手机号"),
    qq_number: z
      .string()
      .trim()
      .regex(/^\d{5,20}$/, "请输入正确的 QQ 号"),
    // Empty means "no personal email"; a filled value is admin-vouched and
    // bound as an `other_mail` login identity without verification.
    personal_email: z
      .string()
      .trim()
      .max(255, "邮箱最多 255 字符")
      .refine(
        (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        "请输入有效的个人邮箱",
      ),
    role: userRoleSchema,
    // A fresh account is never deleted on creation (backend 422).
    state: z.enum(CREATE_USER_STATES),
  })
  .superRefine((values, ctx) => {
    if (
      values.personal_email &&
      values.personal_email.toLowerCase() === values.login_email.toLowerCase()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["personal_email"],
        message: "个人邮箱不能与登录邮箱相同",
      });
    }
  });

export type AdminCreateUserFormValues = z.infer<typeof adminCreateUserSchema>;

export const adminOAuthClientSchema = z
  .object({
    client_name: z.string().trim().min(1, "应用名称不可为空").max(100),
    client_type: z.enum(["first_party", "third_party"]),
    redirect_uris: z
      .array(redirectUriSchema)
      .min(1, "至少填写一个回调地址")
      .max(10, "最多 10 个回调地址")
      .refine((items) => new Set(items).size === items.length, "回调地址不能重复"),
    grant_types: z
      .array(grantTypeSchema)
      .min(1, "至少选择一种授权类型")
      .refine((items) => items.includes("authorization_code"), "必须包含 authorization_code"),
    scopes: z
      .array(scopeSchema)
      .min(1, "至少选择一个权限范围")
      .refine((items) => items.includes("openid"), "必须包含 openid"),
    is_active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    // Mirrors the backend grant door: admin:* is confined to confidential
    // (third_party) clients, so a first_party registration carrying one is refused
    // up front rather than surfacing as a server 400.
    if (
      values.client_type === "first_party" &&
      values.scopes.some((scope) => scope === "admin:read" || scope === "admin:write")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["scopes"],
        message: "admin scope 仅可授予 third_party 客户端",
      });
    }
  });

export type AdminOAuthClientFormValues = z.infer<typeof adminOAuthClientSchema>;

export const adminAuditLogFiltersSchema = z
  .object({
    page: z.coerce.number().int().min(1),
    page_size: z.coerce.number().int().min(1).max(100),
    user_id: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d+$/.test(v), "请输入有效的数字")
      .optional(),
    action: z.string().trim().optional(),
    resource: z.string().trim().optional(),
    success: z.enum(["true", "false", ""]).optional(),
    start_time: z.string().trim().optional(),
    end_time: z.string().trim().optional(),
  })
  .refine(
    (values) => {
      if (!values.start_time || !values.end_time) return true;
      return values.start_time <= values.end_time;
    },
    { message: "开始时间不能晚于结束时间", path: ["end_time"] },
  );

export type AdminAuditLogFiltersFormValues = z.infer<typeof adminAuditLogFiltersSchema>;
