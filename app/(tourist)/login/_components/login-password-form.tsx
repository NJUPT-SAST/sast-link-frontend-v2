"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { passwordLogin } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import { createSession, setSession } from "@/lib/token";
import { safeSessionStorage } from "@/lib/safe-session-storage";
import { consumeAuthNext } from "@/lib/auth-next";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import {
  type LoginPasswordFormValues,
  loginPasswordFormSchema,
} from "@/lib/validations/auth";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { DotLoading } from "@/components/ui/dot-loading";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { PageTransition } from "@/components/animation/page-transition";

interface LoginPasswordFormProps {
  loginEmail: string;
  onBack: () => void;
}

const LOGIN_ACCOUNT_KEY = "sast:login-account";

export default function LoginPasswordForm({ loginEmail, onBack }: LoginPasswordFormProps) {
  const router = useRouter();
  const addAccount = useUserListStore((state) => state.addAccount);
  const resetProfile = useUserProfileStore((state) => state.resetProfile);
  const [loading, setLoading] = useState(false);

  // Safety net: whenever the password step is shown, persist the account and
  // stamp the URL marker so a refresh or back-nav keeps the flow in place.
  useEffect(() => {
    // Keep the account for a mid-flow reload; the step itself is never written
    // to the URL.
    safeSessionStorage.setItem(LOGIN_ACCOUNT_KEY, loginEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const form = useForm<LoginPasswordFormValues>({
    resolver: zodResolver(loginPasswordFormSchema),
    defaultValues: { password: "" },
  });

  // `disabled={loading}` cannot stop a same-frame double click (the state has
  // not committed yet); a ref guard makes a repeat submit a no-op.
  const submittingRef = useRef(false);
  const onValidSubmit = async ({ password }: LoginPasswordFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
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
      // Clear any previous account's profile so the new session starts clean.
      resetProfile();
      addAccount({
        userId: data.user.id,
        loginEmail: data.user.login_email,
        name: data.user.name,
        avatar: null,
        session,
      });
      // Drop the stored account so a later /login never restores a stale
      // session entry. Mid-flow redirect (e.g. back to an OAuth
      // consent request) lands the user where they were heading; a normal
      // sign-in goes to the homepage.
      safeSessionStorage.removeItem(LOGIN_ACCOUNT_KEY);
      router.replace(consumeAuthNext("/home"));
    } catch (error) {
      form.setError("password", { message: toApiError(error).message });
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };
  // The guard only runs in a submit handler, never during render; the rule
  // cannot see through react-hook-form's handleSubmit wrapper.
  // eslint-disable-next-line react-hooks/refs
  const handleSubmit = form.handleSubmit(onValidSubmit);

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
                  <Link
                    href={`/reset?email=${encodeURIComponent(loginEmail)}`}
                    className="text-sm text-link hover:underline"
                  >
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
