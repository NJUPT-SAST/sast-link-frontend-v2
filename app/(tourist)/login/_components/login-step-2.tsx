"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { passwordLogin } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import { createSession, setSession } from "@/lib/token";
import { useUserListStore } from "@/store/use-user-list-store";
import {
  type LoginPasswordFormValues,
  loginPasswordFormSchema,
} from "@/lib/validations/auth";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { LoginSuccessOverlay } from "@/components/animation/login-success-overlay";
import { DotLoading } from "@/components/ui/dot-loading";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { PageTransition } from "@/components/animation/page-transition";

interface LoginStep2Props {
  loginEmail: string;
  onBack: () => void;
}

export default function LoginStep2({ loginEmail, onBack }: LoginStep2Props) {
  const router = useRouter();
  const addAccount = useUserListStore((state) => state.addAccount);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const form = useForm<LoginPasswordFormValues>({
    resolver: zodResolver(loginPasswordFormSchema),
    defaultValues: { password: "" },
  });

  const handleSubmit = form.handleSubmit(async ({ password }) => {
    setLoading(true);
    try {
      const response = await passwordLogin(loginEmail, password);
      const data = response.data.data;
      const session = createSession(
        data.access_token,
        data.refresh_token,
        data.expires_in,
      );
      setSession(session);
      addAccount({
        userId: data.user.id,
        loginEmail: data.user.login_email,
        name: data.user.name,
        avatar: null,
        session,
      });
      setSuccess(true);
    } catch (error) {
      form.setError("password", { message: toApiError(error).message });
    } finally {
      setLoading(false);
    }
  });

  if (success) {
    return <LoginSuccessOverlay onDone={() => router.replace("/home")} />;
  }

  return (
    <PageTransition className="flex w-full flex-col">
      <div className="mb-8 flex flex-col gap-2.5">
        <h2 className="type-title1">输入密码</h2>
        <p className="text-[15px] text-muted-foreground">正在登录 {loginEmail}</p>
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col">
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
                  placeholder="密码"
                  autoComplete="current-password"
                  invalid={!!fieldState.error}
                />
                <div className="mt-1.5 flex justify-end">
                  <Link href="/reset" className="text-xs text-link hover:underline">
                    忘记密码
                  </Link>
                </div>
                <div className="min-h-5 text-xs [&_p]:text-destructive"><FormMessage /></div>
              </FormItem>
            )}
          />
          <div className="mt-2 flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <DotLoading /> : "登录 SAST Link"}
            </Button>
            <Button type="button" variant="outline" onClick={onBack} className="w-full">
              返回上一步
            </Button>
          </div>
        </form>
      </Form>
    </PageTransition>
  );
}
