"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { AdminUpdateUserRequest, UserProfileData } from "@/lib/api/types";
import { COLLEGES } from "@/lib/api/types";
import {
  adminUpdateUserSchema,
  type AdminUpdateUserFormValues,
} from "@/lib/validations/admin";
import { scrollToFirstError } from "@/lib/form";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { FormError } from "@/components/ui/form-error";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

const FIELD_ORDER = [
  "name",
  "student_id",
  "college",
  "major",
  "role",
  "state",
  "login_email",
  "phone_number",
  "qq_number",
];

const ROLE_OPTIONS = [
  { value: "freshman", label: "新生" },
  { value: "member", label: "成员" },
  { value: "lecturer", label: "讲师" },
  { value: "admin", label: "管理员" },
];

const STATE_OPTIONS = [
  { value: "njupter", label: "在校学生" },
  { value: "on_sast", label: "SAST 成员" },
  { value: "retired_sast", label: "已退休" },
  { value: "is_deleted", label: "已注销" },
];

function toFormValues(user: UserProfileData): AdminUpdateUserFormValues {
  return {
    name: user.name,
    phone_number: user.phone_number,
    qq_number: user.qq_number,
    college: user.college,
    major: user.major,
    student_id: user.student_id,
    login_email: user.login_email,
    role: user.role,
    state: user.state,
  };
}

function toRequest(values: AdminUpdateUserFormValues): AdminUpdateUserRequest {
  const request: AdminUpdateUserRequest = {};
  if (values.name !== undefined) request.name = values.name;
  if (values.phone_number !== undefined) request.phone_number = values.phone_number;
  if (values.qq_number !== undefined) request.qq_number = values.qq_number;
  if (values.college !== undefined) request.college = values.college;
  if (values.major !== undefined) request.major = values.major;
  if (values.student_id !== undefined) request.student_id = values.student_id;
  if (values.login_email !== undefined) request.login_email = values.login_email;
  if (values.role !== undefined) request.role = values.role;
  if (values.state !== undefined) request.state = values.state;
  return request;
}

interface UserEditFormProps {
  user: UserProfileData;
  onSubmit: (data: AdminUpdateUserRequest) => Promise<void>;
  loading?: boolean;
}

export function UserEditForm({ user, onSubmit, loading = false }: UserEditFormProps) {
  const router = useRouter();
  const form = useForm<AdminUpdateUserFormValues>({
    resolver: zodResolver(adminUpdateUserSchema),
    defaultValues: toFormValues(user),
  });

  useEffect(() => {
    form.reset(toFormValues(user), { keepDirtyValues: true });
  }, [user, form]);

  const handleValid = async (values: AdminUpdateUserFormValues) => {
    await onSubmit(toRequest(values));
  };

  const handleInvalid = () => {
    scrollToFirstError(form.formState.errors, FIELD_ORDER);
  };

  const submit = form.handleSubmit(handleValid, handleInvalid);

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex max-w-[640px] flex-col gap-6">
        <section aria-label="基本信息">
          <h2 className="type-tech mb-3 text-tertiary">基本信息</h2>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AuthFormField
                    {...field}
                    ref={field.ref}
                    label="姓名"
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="student_id"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AuthFormField
                    {...field}
                    ref={field.ref}
                    label="学号"
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="college"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="college" className="mb-2 block text-[13px] text-muted-foreground">
                    学院
                  </label>
                  <select id="college" {...field} className={selectClass}>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="min-h-4 text-xs">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="major"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AuthFormField
                    {...field}
                    ref={field.ref}
                    label="专业"
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section aria-label="身份与权限">
          <h2 className="type-tech mb-3 text-tertiary">身份与权限</h2>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="role" className="mb-2 block text-[13px] text-muted-foreground">
                    角色
                  </label>
                  <select id="role" {...field} className={selectClass}>
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="min-h-4 text-xs">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="state" className="mb-2 block text-[13px] text-muted-foreground">
                    状态
                  </label>
                  <select id="state" {...field} className={selectClass}>
                    {STATE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="min-h-4 text-xs">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </section>

        <section aria-label="联系方式">
          <h2 className="type-tech mb-3 text-tertiary">联系方式</h2>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="login_email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AuthFormField
                    {...field}
                    ref={field.ref}
                    label="登录邮箱"
                    type="email"
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AuthFormField
                    {...field}
                    ref={field.ref}
                    label="手机号"
                    type="tel"
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qq_number"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AuthFormField
                    {...field}
                    ref={field.ref}
                    label="QQ 号"
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
          </div>
        </section>

        <FormError message={form.formState.errors.root?.message} />

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <DotLoading /> : "保存修改"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            取消
          </Button>
        </div>
      </form>
    </Form>
  );
}
