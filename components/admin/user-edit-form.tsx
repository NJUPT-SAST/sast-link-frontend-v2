"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { AdminUpdateUserRequest, UserProfileData } from "@/lib/api/types";
import { COLLEGES } from "@/lib/api/types";
import {
  adminUpdateUserSchema,
  type AdminUpdateUserFormValues,
} from "@/lib/validations/admin";
import { scrollToFirstError } from "@/lib/form";
import { toApiError } from "@/lib/api/errors";
import { CODE_ALUMNI_BOUND_EMAIL_LIMIT, CODE_VALIDATION } from "@/lib/api/error-codes";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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
  "personal_email",
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
    // A bind is append-only: existing other_mail identities are shown on the
    // detail page, never echoed back here to be edited in place.
    personal_email: "",
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
  // A blank value means "no bind requested", so it is withheld entirely.
  if (values.personal_email) request.personal_email = values.personal_email;
  if (values.role !== undefined) request.role = values.role;
  if (values.state !== undefined) request.state = values.state;
  return request;
}

interface UserEditFormProps {
  user: UserProfileData;
  onSubmit: (data: AdminUpdateUserRequest) => Promise<void>;
  loading?: boolean;
  /** Where 取消 goes when there is no history (direct visit / refresh). Carries
   *  the list's filters so cancelling returns to the page the admin came from. */
  cancelFallback?: string;
}

export function UserEditForm({
  user,
  onSubmit,
  loading = false,
  cancelFallback = "/admin/users",
}: UserEditFormProps) {
  const router = useRouter();
  const form = useForm<AdminUpdateUserFormValues>({
    resolver: zodResolver(adminUpdateUserSchema),
    defaultValues: toFormValues(user),
  });

  useEffect(() => {
    form.reset(toFormValues(user), { keepDirtyValues: true });
  }, [user, form]);

  const handleValid = async (values: AdminUpdateUserFormValues) => {
    try {
      await onSubmit(toRequest(values));
    } catch (error) {
      // Server-side failures (e.g. a login_email already bound to another
      // account) render in the form's root <FormError /> instead of a toast,
      // matching register / reset / profile. Field validation already blocks
      // blank phone/qq inline, so the empty-value case never reaches this far.
      const apiError = toApiError(error);
      if (apiError.code === CODE_ALUMNI_BOUND_EMAIL_LIMIT) {
        form.setError("root", {
          message: "该账号的邮箱绑定数量已达上限（最多 2 个），如需更换请先解绑现有绑定",
        });
      } else if (apiError.code === CODE_VALIDATION && values.personal_email) {
        // The schema already blocks malformed or duplicate addresses, so a
        // 40000 with a bind present is the backend's remaining edge (e.g. a
        // mailbox already bound elsewhere inside a race). Point at the field
        // rather than the generic root error.
        form.setError("personal_email", {
          message: "个人邮箱无法绑定，请检查格式或是否已被其他账号占用",
        });
      } else {
        form.setError("root", { message: apiError.message });
      }
    }
  };

  const handleRederiveState = async () => {
    try {
      await onSubmit({ state_auto: true });
    } catch (error) {
      const apiError = toApiError(error);
      form.setError("root", { message: apiError.message });
    }
  };

  const handleInvalid = () => {
    scrollToFirstError(form.formState.errors, FIELD_ORDER);
  };

  const submit = form.handleSubmit(handleValid, handleInvalid);

  // A deleted account cannot take a new bind; the backend answers 40000. The
  // field unblocks the moment the admin switches 状态 back to a live one in
  // the same form, which the backend accepts transactionally.
  const stateDeleted =
    useWatch({ control: form.control, name: "state" }) === "is_deleted";

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
                  <Select id="college" {...field} className={selectClass}>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
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
                  <Select id="role" {...field} className={selectClass}>
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
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
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="state" className="text-[13px] text-muted-foreground">
                      状态
                    </label>
                    {user.state_manual && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRederiveState}
                        disabled={loading}
                        className="h-auto px-2 py-1 text-xs"
                      >
                        重新派生
                      </Button>
                    )}
                  </div>
                  <Select id="state" {...field} className={selectClass}>
                    {STATE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <div className="min-h-4 text-xs">
                    <FormMessage />
                  </div>
                  {user.state_manual && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ⚙️ 当前为手动设置的状态
                    </p>
                  )}
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
              name="personal_email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AuthFormField
                    {...field}
                    ref={field.ref}
                    label="绑定个人邮箱"
                    type="email"
                    disabled={stateDeleted}
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                    description={
                      stateDeleted
                        ? "已注销用户不可绑定邮箱，请先将状态改回再绑定。"
                        : "免验证直接绑定为登录身份（用于毕业生救援）。不填写则不绑定。"
                    }
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Direct visits have no history to go back to; fall back to the list
              // instead of leaving the site.
              if (window.history.length > 1) router.back();
              else router.replace(cancelFallback);
            }}
            disabled={loading}
          >
            取消
          </Button>
        </div>
      </form>
    </Form>
  );
}
