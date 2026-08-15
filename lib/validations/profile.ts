import { z } from "zod/v3";
import type { RegisterOptions } from "react-hook-form";

import { realNameSchema } from "@/lib/validations/name";

import { COLLEGES } from "@/lib/api/types";

// Protocol is optional here because the edit form renders the scheme as a
// fixed "https://" prefix and submits a normalized value (see withHttpsScheme
// in the edit page) — the backend still requires an explicit http(s) scheme.
// The host must contain at least one dot and no whitespace, so "abc" or
// "not-a-url" fail, and "https://" alone also fails.
const urlPattern = /^$|^(https?:\/\/)?[^\/\s]+\.[^\s]*/;

export interface ProfileFormValues {
  nickname: string;
  name: string;
  intro: string;
  phoneNumber: string;
  qqNumber: string;
  college: string;
  major: string;
  department: string;
  blogUrl: string;
  githubUrl: string;
}

/** Legacy rules — kept for backward compatibility with tests. */
export const profileRules: Record<
  "nickname" | "intro" | "blogUrl" | "githubUrl",
  RegisterOptions<ProfileFormValues>
> = {
  nickname: {
    required: "昵称不能为空",
    maxLength: { value: 255, message: "昵称最多 255 个字符" },
  },
  intro: {
    maxLength: { value: 255, message: "签名最多 255 个字符" },
  },
  blogUrl: {
    maxLength: { value: 512, message: "链接最多 512 个字符" },
    pattern: { value: urlPattern, message: "请输入有效的 URL" },
  },
  githubUrl: {
    maxLength: { value: 512, message: "链接最多 512 个字符" },
    pattern: { value: urlPattern, message: "请输入有效的 URL" },
  },
};

export const profileEditSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, "别名不能为空")
    .max(255, "别名最多 255 个字符"),
  name: realNameSchema,
  intro: z.string().trim().max(255, "签名最多 255 个字符"),
  phoneNumber: z
    .string()
    .trim()
    .refine((v) => v === "" || /^1\d{10}$/.test(v), "请输入 11 位手机号"),
  qqNumber: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{5,20}$/.test(v), "请输入正确的 QQ 号"),
  // college may be empty until the user picks one — "其他" as a default would
  // silently overwrite a blank value on save.
  college: z.enum(COLLEGES).or(z.literal("")),
  major: z.string().trim().min(1, "专业不能为空").max(50),
  // department is shown read-only — managed by admin / recruitment, not edited here
  department: z.enum([
    "",
    "software",
    "media",
    "electronics",
    "office",
    "publicity",
    "outreach",
  ]),
  blogUrl: z
    .string()
    .trim()
    .max(512, "链接最多 512 个字符")
    .refine((v) => v === "" || urlPattern.test(v), "请输入有效的 URL"),
  githubUrl: z
    .string()
    .trim()
    .max(512, "链接最多 512 个字符")
    .refine((v) => v === "" || urlPattern.test(v), "请输入有效的 URL"),
});

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;
