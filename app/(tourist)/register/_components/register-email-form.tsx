"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Link from "next/link";

import { registerSendCode, registerVerifyCode } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import {
  type RegisterVerifyFormValues,
  registerVerifyFormSchema,
} from "@/lib/validations/auth";
import { LoginAccountField } from "@/app/(tourist)/login/_components/login-account-field";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { DotLoading } from "@/components/ui/dot-loading";
import { Button } from "@/components/ui/button";
import { Form, FormItem } from "@/components/ui/form";

interface RegisterEmailFormProps {
  defaultEmail?: string;
  onVerified: (loginEmail: string, registerTicket: string) => void;
}

const COUNTDOWN_SECONDS = 60;

export default function RegisterEmailForm({ defaultEmail = "", onVerified }: RegisterEmailFormProps) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [countdownActive, setCountdownActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard against a same-frame double Enter double-sending the code; `sending`
  // state cannot commit fast enough to stop it.
  const sendingRef = useRef(false);

  // Prefill the domain capsule from the carried email (e.g. back from the
  // details step with an @sast.fun account should keep showing @sast.fun).
  const defaultSuffix = defaultEmail.split("@")[1];
  const initialDomain = defaultSuffix === "sast.fun" ? "@sast.fun" : "@njupt.edu.cn";

  const form = useForm<RegisterVerifyFormValues>({
    resolver: zodResolver(registerVerifyFormSchema),
    defaultValues: {
      account: { localPart: defaultEmail.split("@")[0] ?? "", domain: initialDomain },
      code: "",
    },
  });

  useEffect(() => {
    if (!countdownActive) return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCountdownActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdownActive]);

  const startCountdown = () => {
    setCountdown(COUNTDOWN_SECONDS);
    setCountdownActive(true);
  };

  // Read at call time, never during render: typing only re-renders the
  // `account` Controller, so a render-body getValues() would stay frozen at the
  // mount value and post a bare "@njupt.edu.cn".
  const buildLoginEmail = () => {
    const account = form.getValues("account");
    const localPart = account.localPart.trim().toLowerCase();
    return account.domain.startsWith("@") ? `${localPart}${account.domain}` : localPart;
  };

  const handleSendCode = async () => {
    if (sendingRef.current) return;
    const accountValid = await form.trigger("account");
    if (!accountValid) return;

    sendingRef.current = true;
    setSending(true);
    try {
      await registerSendCode(buildLoginEmail());
      setSent(true);
      startCountdown();
      form.clearErrors("code");
    } catch (error) {
      form.setError("account", { message: toApiError(error).message });
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  const handleVerify = form.handleSubmit(async ({ code }) => {
    setVerifying(true);
    const loginEmail = buildLoginEmail();
    try {
      const response = await registerVerifyCode(loginEmail, code);
      const ticket = response.data.data.register_ticket;
      onVerified(loginEmail, ticket);
    } catch (error) {
      form.setError("code", { message: toApiError(error).message });
    } finally {
      setVerifying(false);
    }
  });

  return (
    <div className="flex w-full flex-col">
      <div className="mb-8 flex flex-col gap-2.5">
        <h2 className="type-title1">创建账户</h2>
      </div>
      <Form {...form}>
        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <Controller
            control={form.control}
            name="account"
            render={({ field, fieldState }) => {
              const errorMessage =
                (fieldState.error as { localPart?: { message?: string } } | undefined)
                  ?.localPart?.message ??
                fieldState.error?.message;
              return (
                <FormItem>
                  <LoginAccountField
                    value={field.value}
                    onChange={field.onChange}
                    label="邮箱"
                    error={errorMessage}
                    // Registration only accepts njupt/sast prefixes, so a typed
                    // `@` must stay visible in the prefix (surfaced as a localPart
                    // error) instead of silently flipping the field to the
                    // other-email mode, where the domain enum error is invisible
                    // and the send-code button no-ops.
                    disableAtDetection
                    allowedDomains={["@njupt.edu.cn", "@sast.fun"]}
                    onEnter={() => {
                      if (!sent) void handleSendCode();
                    }}
                  />
                </FormItem>
              );
            }}
          />

          <AuthFormField
            {...form.register("code")}
            label="验证码"
            placeholder="6 位验证码"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            invalid={!!form.formState.errors.code}
            error={form.formState.errors.code?.message}
            suffix={
              sent ? (
                <button
                  type="button"
                  disabled={countdownActive || sending}
                  onClick={handleSendCode}
                  className="text-sm font-semibold disabled:text-muted-foreground"
                >
                  {countdownActive ? `${countdown}s 后` : ""}重新发送
                </button>
              ) : (
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleSendCode}
                  className="text-sm font-semibold text-primary disabled:text-muted-foreground"
                >
                  {sending ? <DotLoading /> : "获取验证码"}
                </button>
              )
            }
          />

          <Button type="submit" disabled={verifying || !sent} className="mt-2 w-full">
            {verifying ? <DotLoading /> : "继续"}
          </Button>
        </form>
      </Form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        已有账号？
        <Link href="/login" className="text-link hover:underline">登录</Link>
      </p>
    </div>
  );
}
