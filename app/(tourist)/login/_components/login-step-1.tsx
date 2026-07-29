"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Link from "next/link";

import { buildOAuthLoginUrl } from "@/lib/api/oauth";
import {
  type LoginAccountFormValues,
  loginAccountFormSchema,
} from "@/lib/validations/auth";
import { LoginAccountField } from "./login-account-field";
import { Button } from "@/components/ui/button";
import { Form, FormItem } from "@/components/ui/form";
import { OtherLoginList } from "@/components/auth/other-login-list";
import { GithubIcon, LarkIcon } from "@/components/icons/brand-icons";
import { PageTransition } from "@/components/animation/page-transition";

interface LoginStep1Props {
  onNext: (loginEmail: string) => void;
}

export default function LoginStep1({ onNext }: LoginStep1Props) {
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginAccountFormValues>({
    resolver: zodResolver(loginAccountFormSchema),
    defaultValues: {
      account: { localPart: "", domain: "@njupt.edu.cn" },
    },
  });
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
      onNext(`${account.localPart.trim()}${account.domain}`);
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageTransition className="flex w-full flex-col">
      <div className="mb-8 flex flex-col gap-2.5">
        <h2 className="type-title1">登录</h2>
        <p className="text-[15px] text-muted-foreground">使用学号或登录邮箱继续。</p>
      </div>
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
                  />
                  <div className="mt-1.5 flex justify-end">
                    <Link href="/reset" className="text-xs text-link hover:underline">
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
        <Link href="/register" className="text-link hover:underline">注册</Link>
      </p>
    </PageTransition>
  );
}
