"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { changePassword } from "@/lib/api/auth";
import { CODE_PASSWORD_INVALID } from "@/lib/api/error-codes";
import { toApiError } from "@/lib/api/errors";
import { passwordSchema } from "@/lib/validations/auth";
import { message } from "@/lib/message";
import { clearSession } from "@/lib/token";
import { markAuthInvalidated } from "@/lib/auth-cross-tab";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { BackButton } from "@/components/navigation/back-button";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";

interface PasswordValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPasswordPage() {
  const profile = useUserProfileStore((state) => state.profile);
  const resetProfile = useUserProfileStore((state) => state.resetProfile);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PasswordValues>();

  const submit = handleSubmit(async (values) => {
    const parsed = passwordSchema.safeParse(values.newPassword);
    if (!parsed.success) {
      setError("newPassword", { message: parsed.error.issues[0]?.message });
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      setError("confirmPassword", { message: "密码不一致" });
      return;
    }
    setLoading(true);
    try {
      await changePassword(values.oldPassword, values.newPassword);
      // Change-password revokes every session; let the other open tabs drop
      // their local copy too instead of keeping a revoked session.
      markAuthInvalidated();
      clearSession();
      useUserListStore.getState().removeAccount(profile.loginEmail);
      resetProfile();
      message.success("密码已修改，请重新登录");
      router.replace("/login");
    } catch (error) {
      const apiError = toApiError(error);
      // Only a rejected current password belongs under its field; network
      // failures, rate limits and 5xx are not "wrong password" and must not
      // send the user re-typing a password that was correct.
      if (apiError.code === CODE_PASSWORD_INVALID) {
        setError("oldPassword", { message: apiError.message });
      } else {
        setError("root", { message: apiError.message });
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <main className="pt-transition mx-auto flex w-full max-w-[760px] flex-col gap-10 px-5 pb-20 pt-14 sm:px-8">
      <BackButton fallback="/settings" />
      <section aria-label="修改密码">
        <h2 className="type-tech mb-3 text-tertiary">修改密码</h2>
        <p className="mb-4 text-[13px] leading-5 text-tertiary">
          修改成功后需要重新登录。
        </p>
        <form onSubmit={submit} className="flex max-w-[420px] flex-col gap-4">
          <AuthFormField
            id="oldPassword"
            label="当前密码"
            type="password"
            autoComplete="current-password"
            {...register("oldPassword", { required: "请输入当前密码" })}
            invalid={!!errors.oldPassword}
            error={errors.oldPassword?.message}
          />
          <AuthFormField
            id="newPassword"
            label="新密码"
            type="password"
            autoComplete="new-password"
            {...register("newPassword", { required: true })}
            invalid={!!errors.newPassword}
            error={errors.newPassword?.message}
          />
          <AuthFormField
            id="confirmPassword"
            label="确认新密码"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword", { required: true })}
            invalid={!!errors.confirmPassword}
            error={errors.confirmPassword?.message}
          />
          <FormError message={errors.root?.message} />
          <div>
            <Button type="submit" disabled={loading}>
              {loading ? <DotLoading /> : "更新密码"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
