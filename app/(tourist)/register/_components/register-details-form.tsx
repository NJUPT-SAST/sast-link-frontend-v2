"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";

import { completeRegister } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import { updateUserProfile } from "@/lib/api/user";
import { message } from "@/lib/message";
import { COLLEGES, type RegisterRequest } from "@/lib/api/types";
import { postAuthDestination } from "@/lib/auth-destination";
import { createSession, setSession } from "@/lib/token";
import { safeSessionStorage } from "@/lib/safe-session-storage";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import {
  registerDetailsSchema,
  type RegisterDetailsFormValues,
} from "@/lib/validations/auth";
import { scrollToFirstError } from "@/lib/form";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DotLoading } from "@/components/ui/dot-loading";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";

interface RegisterDetailsFormProps {
  loginEmail: string;
  registerTicket: string;
  registrationState?: string;
  oauthState?: string;
  onBack: () => void;
}

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

const FIELD_ORDER = [
  "password",
  "confirmPassword",
  "name",
  "nickname",
  "studentId",
  "college",
  "major",
  "phoneNumber",
  "qqNumber",
];

const studentIdPattern = /^[A-Za-z]\d{8}$/;

function toRegisterRequest(
  values: RegisterDetailsFormValues,
  ticket: string,
  registrationState?: string,
  oauthState?: string,
): RegisterRequest {
  return {
    register_ticket: ticket,
    password: values.password,
    name: values.name,
    phone_number: values.phoneNumber,
    qq_number: values.qqNumber,
    college: values.college,
    major: values.major,
    student_id: values.studentId,
    ...(registrationState ? { registration_state: registrationState } : {}),
    ...(oauthState ? { oauth_state: oauthState } : {}),
  };
}

export default function RegisterDetailsForm({
  loginEmail,
  registerTicket,
  registrationState,
  oauthState,
  onBack,
}: RegisterDetailsFormProps) {
  const router = useRouter();
  const addAccount = useUserListStore((state) => state.addAccount);
  const resetProfile = useUserProfileStore((state) => state.resetProfile);
  const [loading, setLoading] = useState(false);
  // Backend code for a consumed/expired Register-Ticket (errcode 40103). The
  // recovery button must key off this, not the message text — the backend's copy
  // could change to another language without the flow breaking.
  const [ticketInvalid, setTicketInvalid] = useState(false);

  const isNjuptEmail = loginEmail.endsWith("@njupt.edu.cn");
  const autoStudentId = useMemo(() => {
    if (!isNjuptEmail) return "";
    const prefix = loginEmail.split("@")[0] ?? "";
    // Only auto-fill when the email prefix is itself a valid student id —
    // otherwise lock a wrong value in a disabled field the user can't fix.
    return studentIdPattern.test(prefix) ? prefix : "";
  }, [isNjuptEmail, loginEmail]);

  const form = useForm<RegisterDetailsFormValues>({
    resolver: zodResolver(registerDetailsSchema),
    defaultValues: {
      nickname: "",
      name: "",
      password: "",
      confirmPassword: "",
      studentId: autoStudentId,
      college: COLLEGES[0] ?? "其他",
      major: "",
      phoneNumber: "",
      qqNumber: "",
    },
  });

  const onValid = async (values: RegisterDetailsFormValues) => {
    setLoading(true);
    try {
      const response = await completeRegister(
        toRegisterRequest(values, registerTicket, registrationState, oauthState),
      );
      const data = response.data.data;
      const session = createSession(data.access_token, data.expires_in);
      setSession(session);
      resetProfile();
      addAccount({
        userId: data.user.id,
        loginEmail: data.user.login_email,
        name: data.user.name,
        avatar: null,
        session,
      });
      // Register API doesn't accept nickname; set it right after signup. This is
      // best-effort — a failed nickname write must not strand the user on the
      // register form holding a valid session (they can edit it later). But a
      // silent loss of the nickname they just typed is worse than a toast.
      try {
        await updateUserProfile({ nickname: values.nickname });
      } catch {
        message.error("别名保存失败，稍后可在个人资料中修改");
      }
      // A successful signup is a finished flow: clear the stored ticket/email so
      // a later /register starts at the email step instead of resurrecting this
      // one-time ticket (login clears its step key for the same reason).
      safeSessionStorage.removeItem("sast:register-ticket");
      safeSessionStorage.removeItem("sast:register-email");
      // A successful signup is a finished flow, but where the user lands depends
      // on where they came from: an OAuth consent flow (consent → login →
      // register) goes back to the pending consent request to finish the
      // authorization; a direct signup falls through to /home (or, for an
      // account still marked incomplete — e.g. a name that equals its student_id
      // — to the guided completion page).
      router.replace(postAuthDestination(data, "/home"));
    } catch (error) {
      const apiError = toApiError(error);
      form.setError("root", { message: apiError.message });
      setTicketInvalid(apiError.code === 40103);
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = () => {
    scrollToFirstError(form.formState.errors, FIELD_ORDER);
  };

  const submit = form.handleSubmit(onValid, onInvalid);

  return (
    <main className="pt-transition mx-auto flex w-full max-w-[760px] flex-col gap-10 px-5 pb-20 pt-14 sm:px-8">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        返回
      </Button>

      <div className="mb-2 flex flex-col gap-2.5">
        <h2 className="type-title1">完善信息</h2>
        <p className="text-[15px] text-muted-foreground">正在使用 {loginEmail} 注册。</p>
      </div>

      <Form {...form}>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <p className="type-tech text-xs text-tertiary">
            带 <span className="text-destructive">*</span> 项为必填
          </p>

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <AuthFormField
                  {...field}
                  ref={field.ref}
                  label="密码"
                  type="password"
                  autoComplete="new-password"
                  required
                  invalid={fieldState.invalid}
                  error={fieldState.error?.message}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <AuthFormField
                  {...field}
                  ref={field.ref}
                  label="确认密码"
                  type="password"
                  autoComplete="new-password"
                  required
                  invalid={fieldState.invalid}
                  error={fieldState.error?.message}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <AuthFormField
                  {...field}
                  ref={field.ref}
                  label="真实姓名"
                  required
                  invalid={fieldState.invalid}
                  error={fieldState.error?.message}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nickname"
            render={({ field, fieldState }) => (
              <FormItem>
                <AuthFormField
                  {...field}
                  ref={field.ref}
                  label="别名"
                  required
                  description="其他用户将看到此名称"
                  invalid={fieldState.invalid}
                  error={fieldState.error?.message}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentId"
            render={({ field, fieldState }) => (
              <FormItem>
                <AuthFormField
                  {...field}
                  ref={field.ref}
                  label="学号"
                  required
                  disabled={isNjuptEmail && !!autoStudentId}
                  description={
                    isNjuptEmail
                      ? autoStudentId
                        ? "已从邮箱自动填入"
                        : "邮箱前缀不是标准学号，请手动填写"
                      : "使用 @sast.fun 邮箱注册，请填写学号（注册后不可修改）"
                  }
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
                <label
                  htmlFor="college"
                  className="mb-2 block text-[13px] text-muted-foreground"
                >
                  学院
                </label>
                <Select id="college" {...field} className={selectClass}>
                  {COLLEGES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <div className="min-h-4 text-xs [&_p]:text-destructive">
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
                  required
                  invalid={fieldState.invalid}
                  error={fieldState.error?.message}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
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
            name="qqNumber"
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

          <FormError message={form.formState.errors.root?.message} />

          {(ticketInvalid || form.formState.errors.root?.message?.includes("过期")) && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-link hover:underline"
            >
              验证已过期，返回重新获取验证码
            </button>
          )}

          <div className="mt-2 flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <DotLoading /> : "创建账户"}
            </Button>
            <Button type="button" variant="outline" onClick={onBack} className="w-full">
              返回上一步
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
