"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { registerSendCode, registerVerifyCode } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import { message } from "@/lib/message";
import {
  type VerificationCodeFormValues,
  verificationCodeFormSchema,
} from "@/lib/validations/auth";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { VerificationCodeInput } from "@/components/auth/verification-code-input";
import { DotLoading } from "@/components/ui/dot-loading";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";

interface RegisterStep2Props {
  loginEmail: string;
  onNext: (ticket: string) => void;
  onBack: () => void;
}

export default function RegisterStep2({ loginEmail, onNext, onBack }: RegisterStep2Props) {
  const [loading, setLoading] = useState(false);
  const form = useForm<VerificationCodeFormValues>({
    resolver: zodResolver(verificationCodeFormSchema),
    defaultValues: { captcha: "" },
  });

  const handleSubmit = form.handleSubmit(async ({ captcha }) => {
    setLoading(true);
    try {
      const response = await registerVerifyCode(loginEmail, captcha);
      onNext(response.data.data.register_ticket);
    } catch (error) {
      form.setError("captcha", { message: toApiError(error).message });
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex w-full flex-col">
      <div className="mb-8 flex flex-col gap-2.5">
        <h2 className="type-title1">输入验证码</h2>
        <p className="text-[15px] text-muted-foreground">已发送至 {loginEmail}</p>
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <FormField control={form.control} name="captcha" render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField {...field} ref={field.ref} label="验证码" placeholder="6 位验证码" autoComplete="one-time-code" inputMode="numeric" maxLength={6} invalid={!!fieldState.error} suffix={<VerificationCodeInput onResend={async () => { try { await registerSendCode(loginEmail); } catch (error) { message.error(toApiError(error).message); throw error; } }} />} />
              <div className="min-h-5 text-xs [&_p]:text-destructive"><FormMessage /></div>
            </FormItem>
          )} />
          <div className="mt-2 flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <DotLoading /> : "验证并继续"}
            </Button>
            <Button type="button" variant="outline" onClick={onBack} className="w-full">返回上一步</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
