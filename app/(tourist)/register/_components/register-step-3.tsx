"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { completeRegister } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import { COLLEGES } from "@/lib/api/types";
import { createSession, setSession } from "@/lib/token";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import {
  type RegisterDetailsFormValues,
  registerDetailsSchema,
} from "@/lib/validations/auth";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { DotLoading } from "@/components/ui/dot-loading";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";

interface RegisterStep3Props {
  loginEmail: string;
  ticket: string;
  registrationState?: string;
  oauthState?: string;
  defaultName?: string;
  onBack: () => void;
}

export default function RegisterStep3({ loginEmail, ticket, registrationState, oauthState, defaultName = "", onBack }: RegisterStep3Props) {
  const router = useRouter();
  const addAccount = useUserListStore((state) => state.addAccount);
  const resetProfile = useUserProfileStore((state) => state.resetProfile);
  const [loading, setLoading] = useState(false);
  const form = useForm<RegisterDetailsFormValues>({
    resolver: zodResolver(registerDetailsSchema),
    defaultValues: {
      password: "", confirmPassword: "", name: defaultName,
      phoneNumber: "", qqNumber: "", college: "其他", major: "", studentId: loginEmail.split("@")[0],
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const response = await completeRegister({
        register_ticket: ticket,
        password: values.password,
        name: values.name,
        phone_number: values.phoneNumber,
        qq_number: values.qqNumber,
        college: values.college,
        major: values.major,
        student_id: values.studentId,
        ...(registrationState && oauthState ? { registration_state: registrationState, oauth_state: oauthState } : {}),
      });
      const data = response.data.data;
      const session = createSession(data.access_token, data.refresh_token, data.expires_in);
      setSession(session);
      resetProfile();
      addAccount({ userId: data.user.id, loginEmail: data.user.login_email, name: data.user.name, avatar: null, session });
      router.replace("/home");
    } catch (error) {
      form.setError("root", { message: toApiError(error).message });
    } finally {
      setLoading(false);
    }
  });

  const fields: Array<{ name: "name" | "phoneNumber" | "qqNumber" | "major" | "studentId"; label: string; type?: string }> = [
    { name: "name", label: "真实姓名" }, { name: "studentId", label: "学号" },
    { name: "major", label: "专业" }, { name: "phoneNumber", label: "手机号", type: "tel" },
    { name: "qqNumber", label: "QQ 号" },
  ];

  return (
    <div className="flex w-full flex-col">
      <div className="mb-6 flex flex-col gap-2.5">
        <h2 className="type-title1">个人资料</h2>
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fields.map(({ name, label, type }) => (
            <FormField key={name} control={form.control} name={name} render={({ field }) => (
              <FormItem>
                <AuthFormField {...field} ref={field.ref} label={label} type={type} />
                <div className="min-h-4 text-xs [&_p]:text-destructive"><FormMessage /></div>
              </FormItem>
            )} />
          ))}
          <FormField control={form.control} name="college" render={({ field }) => (
            <FormItem>
              <label htmlFor="college" className="mb-2 block text-[13px] text-muted-foreground">学院</label>
              <select
                id="college"
                {...field}
                className="h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              >
                {COLLEGES.map((college) => <option key={college} value={college}>{college}</option>)}
              </select>
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <AuthFormField {...field} ref={field.ref} label="设置密码" type="password" autoComplete="new-password" description="至少 8 位，建议混合字母与数字。" />
              <div className="min-h-4 text-xs [&_p]:text-destructive"><FormMessage /></div>
            </FormItem>
          )} />
          <FormField control={form.control} name="confirmPassword" render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField {...field} ref={field.ref} label="确认密码" type="password" autoComplete="new-password" invalid={!!fieldState.error} />
              <div className="min-h-4 text-xs [&_p]:text-destructive"><FormMessage /></div>
            </FormItem>
          )} />
          <FormError message={form.formState.errors.root?.message} />
          <div className="mt-2 flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <DotLoading /> : "完成注册"}
            </Button>
            <Button type="button" variant="outline" onClick={onBack} className="w-full">返回上一步</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
