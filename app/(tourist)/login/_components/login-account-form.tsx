"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Link from "next/link";

import { buildOAuthLoginUrl } from "@/lib/api/oauth";
import {
  type LoginAccountFormValues,
  loginAccountFormSchema,
} from "@/lib/validations/auth";
import { safeLocalStorage } from "@/lib/safe-local-storage";
import { safeSessionStorage } from "@/lib/safe-session-storage";
import { LoginAccountField } from "./login-account-field";
import { Button } from "@/components/ui/button";
import { Form, FormItem } from "@/components/ui/form";
import { OtherLoginList } from "@/components/auth/other-login-list";
import { GithubIcon, LarkIcon } from "@/components/icons/brand-icons";
import { PageTransition } from "@/components/animation/page-transition";

// The last account an operator logged in with, remembered locally so the next
// visit starts pre-filled. The domain is the "type" — njupt vs sast.fun vs a
// foreign address — so both halves of the segmented field are restored. Never
// written into a URL: localStorage only.
const LAST_LOGIN_ACCOUNT_KEY = "sast:last-login-account";
// Same hand-off key as the password step: /reset pre-fills whatever the user
// already typed, without the email ever riding in a URL.
const RESET_ACCOUNT_KEY = "sast:reset-account";
const ALLOWED_DOMAINS = ["@njupt.edu.cn", "@sast.fun", "其他邮箱"] as const;

function readRememberedAccount(): {
  localPart: string;
  domain: LoginAccountFormValues["account"]["domain"];
} | null {
  const raw = safeLocalStorage.getItem(LAST_LOGIN_ACCOUNT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { localPart?: unknown; domain?: unknown };
    if (
      typeof parsed.localPart === "string" &&
      parsed.localPart.trim() &&
      typeof parsed.domain === "string" &&
      (ALLOWED_DOMAINS as readonly string[]).includes(parsed.domain)
    ) {
      return {
        localPart: parsed.localPart,
        domain: parsed.domain as LoginAccountFormValues["account"]["domain"],
      };
    }
  } catch {
    // Corrupt entry — start blank.
  }
  return null;
}

interface LoginAccountFormProps {
  onNext: (loginEmail: string) => void;
  /** transient notice shown above the form, e.g. "密码已重置" */
  resetNotice?: string | null;
}

export default function LoginAccountForm({ onNext, resetNotice }: LoginAccountFormProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginAccountFormValues>({
    resolver: zodResolver(loginAccountFormSchema),
    defaultValues: {
      account: { localPart: "", domain: "@njupt.edu.cn" },
    },
  });

  // Restore the remembered account on mount, not in defaultValues: reading
  // localStorage during render would desync the server HTML from the client
  // (the store does not exist server-side), which hydrates as a mismatch.
  useEffect(() => {
    const remembered = readRememberedAccount();
    if (remembered) {
      form.reset({ account: remembered });
    }
  }, [form]);
  const oauthList = useMemo(
    () => [
      {
        target: buildOAuthLoginUrl("github"),
        describe: "GitHub",
        icon: <GithubIcon />,
      },
      {
        target: buildOAuthLoginUrl("lark"),
        describe: "飞书",
        icon: <LarkIcon />,
      },
    ],
    [],
  );

  const handleSubmit = form.handleSubmit(({ account }) => {
    setLoading(true);
    try {
      const localPart = account.localPart.trim().toLowerCase();
      const loginEmail = account.domain.startsWith("@")
        ? `${localPart}${account.domain}`
        : localPart;
      // Remember the account (local part + domain type) for the next visit.
      // Stored locally only, never sent in a URL.
      safeLocalStorage.setItem(
        LAST_LOGIN_ACCOUNT_KEY,
        JSON.stringify({ localPart, domain: account.domain }),
      );
      onNext(loginEmail);
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageTransition className="flex w-full flex-col">
      <div className="mb-8 flex flex-col gap-2.5">
        <h2 className="type-title1 text-center">登录</h2>
      </div>
      {resetNotice && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
          {resetNotice}
        </div>
      )}
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col">
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
                    error={errorMessage}
                    allowedDomains={["@njupt.edu.cn", "@sast.fun", "其他邮箱"]}
                  />
                  <div className="mt-1.5 flex justify-end">
                    <Link
                      href="/reset"
                      onClick={() => {
                        const localPart = field.value.localPart.trim().toLowerCase();
                        const email = field.value.domain.startsWith("@")
                          ? `${localPart}${field.value.domain}`
                          : localPart;
                        safeSessionStorage.setItem(RESET_ACCOUNT_KEY, email);
                      }}
                      className="text-sm text-link hover:underline"
                    >
                      忘记密码
                    </Link>
                  </div>
                </FormItem>
              );
            }}
          />
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            继续
          </Button>
        </form>
      </Form>
      <div className="my-7 flex items-center gap-3.5 text-xs text-tertiary">
        <span className="h-px flex-1 bg-hairline" />或<span className="h-px flex-1 bg-hairline" />
      </div>
      <OtherLoginList list={oauthList} />
      <p className="mt-7 text-center text-sm text-muted-foreground">
        没有账号？
        <Link href="/register" className="text-link text-lg hover:underline">注册</Link>
      </p>
    </PageTransition>
  );
}
