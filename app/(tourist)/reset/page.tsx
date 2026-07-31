"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";

import { forgotPasswordSendCode, resetPassword } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import { loginEmailSchema, resetPasswordFormSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { PageTransition } from "@/components/animation/page-transition";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { FormError } from "@/components/ui/form-error";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";

export default function ResetPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const form = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordFormSchema), defaultValues: { code: "", password: "", confirmPassword: "" } });

  const sendCode = async () => {
    const parsed = loginEmailSchema.safeParse(loginEmail);
    if (!parsed.success) { form.setError("root", { message: parsed.error.issues[0]?.message }); return; }
    setLoading(true);
    try { await forgotPasswordSendCode(parsed.data); setSent(true); }
    catch (error) { form.setError("root", { message: toApiError(error).message }); }
    finally { setLoading(false); }
  };

  const submit = form.handleSubmit(async ({ code, password }) => {
    setLoading(true);
    try { await resetPassword(loginEmail, code, password); router.replace("/login"); }
    catch (error) { form.setError("root", { message: toApiError(error).message }); }
    finally { setLoading(false); }
  });

  return (
    <AuthShell
      tech={sent ? "Reset / 02 of 02" : "Reset / 01 of 02"}
    >
      <PageTransition variant="fade" key={sent ? "done" : "send"}>
        <div className="mb-8 flex flex-col gap-2.5">
          <h2 className="type-title1">{sent ? "设置新密码" : "重置密码"}</h2>
          <p className="text-[15px] text-muted-foreground">
            {sent ? `验证码已发送至 ${loginEmail}` : "输入注册邮箱，我们发送验证码。"}
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {!sent && (
              <>
                <AuthFormField label="邮箱" type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="name@njupt.edu.cn" />
                <Button type="button" onClick={sendCode} disabled={loading} className="w-full">
                  {loading ? <DotLoading /> : "发送验证码"}
                </Button>
              </>
            )}
            {sent && (
              <>
                <FormField control={form.control} name="code" render={({ field }) => <FormItem><AuthFormField {...field} ref={field.ref} label="验证码" maxLength={6} inputMode="numeric" /><div className="min-h-4 text-xs [&_p]:text-destructive"><FormMessage /></div></FormItem>} />
                <FormField control={form.control} name="password" render={({ field }) => <FormItem><AuthFormField {...field} ref={field.ref} label="新密码" type="password" description="至少 8 位，建议混合字母与数字。" /><div className="min-h-4 text-xs [&_p]:text-destructive"><FormMessage /></div></FormItem>} />
                <FormField control={form.control} name="confirmPassword" render={({ field, fieldState }) => <FormItem><AuthFormField {...field} ref={field.ref} label="确认新密码" type="password" invalid={!!fieldState.error} /><div className="min-h-4 text-xs [&_p]:text-destructive"><FormMessage /></div></FormItem>} />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <DotLoading /> : "重置密码"}
                </Button>
              </>
            )}
            <FormError message={form.formState.errors.root?.message} />
          </form>
        </Form>
        {!sent && (
          <p className="mt-7 text-center text-sm text-muted-foreground">
            想起来了？
            <Link href="/login" className="text-link hover:underline">返回登录</Link>
          </p>
        )}
      </PageTransition>
    </AuthShell>
  );
}
