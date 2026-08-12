"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";

import { forgotPasswordSendCode, resetPassword } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import {
  loginEmailSchema,
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";
import { safeSessionStorage } from "@/lib/safe-session-storage";
import { AuthShell } from "@/components/auth/auth-shell";
import { PageTransition } from "@/components/animation/page-transition";
import { LoginAccountField } from "@/app/(tourist)/login/_components/login-account-field";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { VerificationCodeInput } from "@/components/auth/verification-code-input";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { FormError } from "@/components/ui/form-error";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";

const ALLOWED_DOMAINS = ["@njupt.edu.cn", "@sast.fun"] as const;
type Domain = "@njupt.edu.cn" | "@sast.fun" | "其他邮箱";
type AccountValue = { localPart: string; domain: Domain };

// The login page drops the account here (not in a URL — query strings leak into
// history, Referer headers and server logs) so a user who typed it once does
// not have to retype it after clicking "忘记密码" / the migration notice.
const RESET_ACCOUNT_KEY = "sast:reset-account";

function parseEmail(email: string): AccountValue {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.indexOf("@");
  if (atIndex < 0) {
    return { localPart: trimmed, domain: "@njupt.edu.cn" };
  }
  const localPart = trimmed.slice(0, atIndex);
  const suffix = `@${trimmed.slice(atIndex + 1)}`;
  const domain: Domain = ALLOWED_DOMAINS.find((d) => d === suffix) ?? "其他邮箱";
  if (domain === "其他邮箱") {
    // Keep the whole address (login's other-mail mode does the same) instead of
    // silently rewriting e.g. alice@qq.com to alice@njupt.edu.cn; validation
    // then explains reset only supports primary @njupt.edu.cn / @sast.fun.
    return { localPart: trimmed, domain };
  }
  return { localPart, domain };
}

function buildEmail(account: AccountValue): string {
  const localPart = account.localPart.trim().toLowerCase();
  return account.domain.startsWith("@") ? `${localPart}${account.domain}` : localPart;
}

function ResetFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [account, setAccount] = useState<AccountValue>(
    () => parseEmail(searchParams.get("email") ?? ""),
  );
  // The login page hands the account over in sessionStorage (never a URL);
  // prefer it over any legacy `?email=` value and consume it so a later bare
  // /reset does not resurrect a stale account. One-shot client initialisation —
  // the store does not exist server-side — so the empty dependency array does
  // not re-run or cascade.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const remembered = safeSessionStorage.getItem(RESET_ACCOUNT_KEY);
    if (remembered) {
      setAccount(parseEmail(remembered));
      safeSessionStorage.removeItem(RESET_ACCOUNT_KEY);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const loginEmail = buildEmail(account);

  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accountError, setAccountError] = useState<string | undefined>(undefined);
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  const handleSendCodeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendCode();
  };

  const sendCode = async () => {
    setAccountError(undefined);
    const parsed = loginEmailSchema.safeParse(loginEmail);
    if (!parsed.success) {
      setAccountError(parsed.error.issues[0]?.message);
      return;
    }
    setSending(true);
    try {
      await forgotPasswordSendCode(parsed.data);
      setSent(true);
      form.clearErrors("root");
    } catch (error) {
      form.setError("root", { message: toApiError(error).message });
    } finally {
      setSending(false);
    }
  };

  const submit = form.handleSubmit(async ({ code, password }) => {
    setSubmitting(true);
    try {
      await resetPassword(loginEmail, code, password);
      router.replace("/login?reset=success");
    } catch (error) {
      form.setError("root", { message: toApiError(error).message });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell>
      <PageTransition variant="fade" key={sent ? "done" : "send"}>
        {!sent ? (
          <>
            <div className="mb-8 flex flex-col gap-2.5">
              <h2 className="type-title1">重置密码</h2>
              <p className="text-[15px] text-muted-foreground">输入注册邮箱，我们发送验证码。</p>
            </div>
            <form onSubmit={handleSendCodeSubmit} className="flex flex-col gap-4">
              <LoginAccountField
                value={account}
                onChange={setAccount}
                label="邮箱"
                error={accountError}
                allowedDomains={[...ALLOWED_DOMAINS, "其他邮箱"]}
                context="reset"
              />
              <Button type="submit" disabled={sending} className="w-full">
                {sending ? <DotLoading /> : "发送验证码"}
              </Button>
              <FormError message={form.formState.errors.root?.message} />
            </form>
            <p className="mt-7 text-center text-sm text-muted-foreground">
              想起来了？
              <Link href="/login" className="text-link hover:underline">返回登录</Link>
            </p>
          </>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-2.5">
              <h2 className="type-title1">设置新密码</h2>
              <p className="text-[15px] text-muted-foreground">验证码已发送至 {loginEmail}。</p>
            </div>
            <Form {...form}>
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-card px-3.5 py-2.5">
                  <span className="truncate text-sm text-muted-foreground">{loginEmail}</span>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="shrink-0 text-sm text-link hover:underline"
                  >
                    修改邮箱
                  </button>
                </div>
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label="验证码"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        suffix={
                          <VerificationCodeInput
                            onResend={async () => {
                              await forgotPasswordSendCode(loginEmail);
                            }}
                          />
                        }
                      />
                      <div className="min-h-4 text-xs [&_p]:text-destructive">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label="新密码"
                        type="password"
                        required
                        description="至少 8 位，建议混合字母与数字。"
                      />
                      <div className="min-h-4 text-xs [&_p]:text-destructive">
                        <FormMessage />
                      </div>
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
                        label="确认新密码"
                        type="password"
                        required
                        invalid={!!fieldState.error}
                      />
                      <div className="min-h-4 text-xs [&_p]:text-destructive">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? <DotLoading /> : "重置密码"}
                </Button>
                <FormError message={form.formState.errors.root?.message} />
              </form>
            </Form>
          </>
        )}
      </PageTransition>
    </AuthShell>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetFlow />
    </Suspense>
  );
}
