"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { changePassword } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import { passwordSchema } from "@/lib/validations/auth";
import { message } from "@/lib/message";
import { clearSession } from "@/lib/token";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { BackButton } from "@/components/navigation/back-button";
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
      clearSession();
      useUserListStore.getState().removeAccount(profile.loginEmail);
      resetProfile();
      message.success("密码已修改，请重新登录");
      router.replace("/login");
    } catch (error) {
      setError("oldPassword", { message: toApiError(error).message });
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
            {...register("oldPassword", { required: "请输入当前密码" })}
            invalid={!!errors.oldPassword}
            error={errors.oldPassword?.message}
          />
          <AuthFormField
            id="newPassword"
            label="新密码"
            type="password"
            {...register("newPassword", { required: true })}
            invalid={!!errors.newPassword}
            error={errors.newPassword?.message}
          />
          <AuthFormField
            id="confirmPassword"
            label="确认新密码"
            type="password"
            {...register("confirmPassword", { required: true })}
            invalid={!!errors.confirmPassword}
            error={errors.confirmPassword?.message}
          />
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
