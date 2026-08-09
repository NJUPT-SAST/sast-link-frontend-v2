import { z } from "zod/v3";

import { COLLEGES } from "@/lib/api/types";

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
const scopeSchema = z.enum(["openid", "profile", "email"]);

export const adminUserFiltersSchema = z.object({
  page: z.coerce.number().int().min(1),
  page_size: z.coerce.number().int().min(1).max(100),
  role: userRoleSchema.optional().or(z.literal("")),
  state: userStateSchema.optional().or(z.literal("")),
  department: departmentSchema.optional().or(z.literal("")),
  student_id: z.string().trim().optional(),
  keyword: z.string().trim().optional(),
});

export type AdminUserFiltersFormValues = z.infer<typeof adminUserFiltersSchema>;

export const adminUpdateUserSchema = z
  .object({
    name: z.string().trim().min(1, "姓名不可为空").max(255).optional(),
    phone_number: z
      .string()
      .trim()
      .refine((v) => v === undefined || v === "" || /^1\d{10}$/.test(v), "请输入 11 位手机号")
      .optional(),
    qq_number: z
      .string()
      .trim()
      .refine((v) => v === undefined || v === "" || /^\d{5,20}$/.test(v), "请输入正确的 QQ 号")
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

export const adminOAuthClientSchema = z.object({
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
});

export type AdminOAuthClientFormValues = z.infer<typeof adminOAuthClientSchema>;

export const adminUpdateOAuthClientSchema = adminOAuthClientSchema
  .partial()
  .extend({
    client_name: z.string().trim().min(1, "应用名称不可为空").max(100).optional(),
    redirect_uris: z
      .array(redirectUriSchema)
      .max(10, "最多 10 个回调地址")
      .refine((items) => !items || new Set(items).size === items.length, "回调地址不能重复")
      .optional(),
    grant_types: z.array(grantTypeSchema).optional(),
    scopes: z.array(scopeSchema).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((values) => Object.keys(values).length > 0, "至少修改一个字段");

export type AdminUpdateOAuthClientFormValues = z.infer<typeof adminUpdateOAuthClientSchema>;

export const adminAuditLogFiltersSchema = z.object({
  page: z.coerce.number().int().min(1),
  page_size: z.coerce.number().int().min(1).max(100),
  user_id: z.coerce.number().int().positive().optional(),
  action: z.string().trim().optional(),
  resource: z.string().trim().optional(),
  success: z.enum(["true", "false", ""]).optional(),
  start_time: z.string().trim().optional(),
  end_time: z.string().trim().optional(),
});

export type AdminAuditLogFiltersFormValues = z.infer<typeof adminAuditLogFiltersSchema>;
