"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Link from "next/link";

import { registerSendCode } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import {
  type RegisterAccountFormValues,
  registerAccountFormSchema,
} from "@/lib/validations/auth";
import { LoginAccountField } from "@/app/(tourist)/login/_components/login-account-field";
import { DotLoading } from "@/components/ui/dot-loading";
import { Button } from "@/components/ui/button";
import { Form, FormItem } from "@/components/ui/form";

interface RegisterStep1Props {
  defaultEmail?: string;
  onNext: (loginEmail: string) => void;
}

export default function RegisterStep1({ defaultEmail = "", onNext }: RegisterStep1Props) {
  const [loading, setLoading] = useState(false);
  const form = useForm<RegisterAccountFormValues>({
    resolver: zodResolver(registerAccountFormSchema),
    defaultValues: {
      account: { localPart: defaultEmail.split("@")[0] ?? "", domain: "@njupt.edu.cn" },
    },
  });

  const handleSubmit = form.handleSubmit(({ account }) => {
    setLoading(true);
    const loginEmail = `${account.localPart.trim()}${account.domain}`;
    registerSendCode(loginEmail)
      .then(() => onNext(loginEmail))
      .catch((error) =>
        form.setError("account", {
          message: toApiError(error).message,
        }),
      )
      .finally(() => setLoading(false));
  });

  return (
    <div className="flex w-full flex-col">
      <div className="mb-8 flex flex-col gap-2.5">
        <h2 className="type-title1">创建账户</h2>
        <p className="text-[15px] text-muted-foreground">使用南邮邮箱或 SAST 邮箱注册。</p>
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
                    label="邮箱"
                    error={errorMessage}
                    disableAtDetection
                    allowedDomains={["@njupt.edu.cn", "@sast.fun"]}
                  />
                </FormItem>
              );
            }}
          />
          <Button type="submit" disabled={loading} className="mt-5 w-full">
            {loading ? <DotLoading /> : "发送验证码"}
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
