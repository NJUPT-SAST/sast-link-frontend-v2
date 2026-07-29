"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { changePassword, logout } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import { passwordSchema } from "@/lib/validations/auth";
import { message } from "@/lib/message";
import { getSession, clearSession } from "@/lib/token";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { avatarFallbackChar, DEFAULT_AVATAR } from "@/lib/constants/profile";
import { cn } from "@/lib/utils";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { IdentityList } from "@/components/user/identity-list";
import { OtherEmailList } from "@/components/user/other-email-list";

const ROLE_LABELS: Record<string, string> = {
  freshman: "新生",
  member: "成员",
  lecturer: "讲师",
  admin: "管理员",
};

const STATE_LABELS: Record<string, string> = {
  njupter: "在校学生",
  on_sast: "SAST 成员",
  retired_sast: "已退休",
  is_deleted: "已注销",
};

const EMAIL_TYPE_LABELS: Record<string, string> = {
  njupt_email: "南邮邮箱",
  sast_email: "SAST 邮箱",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  "软件研发部": "软件研发部",
  "多媒体部": "多媒体部",
  "电子部": "电子部",
  "办公室部": "办公室部",
  "科宣部": "科宣部",
  "外联部": "外联部",
};

function Field({
  label,
  value,
  empty = "未填写",
}: {
  label: string;
  value?: string | null;
  empty?: string;
}) {
  return (
    <div data-cursor-target className="grid grid-cols-[88px_minmax(0,1fr)] gap-5 border-b border-hairline py-4 first:border-t">
      <div className="type-tech text-tertiary">{label}</div>
      <div className={cn("truncate text-sm leading-6", !value && "text-muted-foreground")}>
        {value || empty}
      </div>
    </div>
  );
}

interface PasswordValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const profile = useUserProfileStore((state) => state.profile);
  const resetProfile = useUserProfileStore((state) => state.resetProfile);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
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
      reset();
      message.success("密码已更新");
    } catch (error) {
      setError("oldPassword", { message: toApiError(error).message });
    } finally {
      setLoading(false);
    }
  });

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const session = getSession();
      if (session) await logout(session.refreshToken);
    } catch {
      /* fire and forget — local cleanup always runs */
    }
    clearSession();
    useUserListStore.getState().removeAccount(profile.loginEmail);
    resetProfile();
    router.replace("/login");
  };

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-14 px-5 pb-20 pt-14 sm:px-8">
      <section aria-label="基本资料" className="flex items-center gap-6">
        <Avatar className="size-20 border border-foreground">
          <AvatarImage src={profile.avatar ?? DEFAULT_AVATAR} alt={profile.nickname} />
          <AvatarFallback className="text-2xl">{avatarFallbackChar(profile)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="type-title2 truncate">{profile.nickname || profile.name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {ROLE_LABELS[profile.role] || profile.role} · {STATE_LABELS[profile.state] || profile.state}
          </div>
        </div>
        <Link
          href="/settings/edit"
          className="ml-auto shrink-0 type-tech text-tertiary transition-colors hover:text-foreground"
        >
          编辑
        </Link>
      </section>

      <section aria-label="个人信息">
        <h2 className="type-tech mb-3 text-tertiary">个人信息</h2>
        <Field label="姓名" value={profile.name} />
        <Field label="昵称" value={profile.nickname} />
        <Field label="学号" value={profile.studentId} />
        <Field label="学院" value={profile.college} />
        <Field label="专业" value={profile.major} />
        <Field label="签名" value={profile.intro} empty={profile.intro ? "" : "你还没留下签名哦～"} />
        {profile.state !== "njupter" && (
          <Field
            label="部门"
            value={profile.department ? DEPARTMENT_LABELS[profile.department] ?? profile.department : null}
          />
        )}
      </section>

      <section aria-label="联系方式">
        <h2 className="type-tech mb-3 text-tertiary">联系方式</h2>
        <Field label="登录邮箱" value={profile.loginEmail} />
        <div data-cursor-target className="grid grid-cols-[88px_minmax(0,1fr)] gap-5 border-b border-hairline py-4 first:border-t">
          <OtherEmailList />
        </div>
        <Field label="手机号" value={profile.phoneNumber} />
        <Field label="QQ" value={profile.qqNumber} />
        <Field label="博客" value={profile.blogUrl} />
        <Field label="GitHub" value={profile.githubUrl} />
      </section>

      <section aria-label="账户">
        <h2 className="type-tech mb-3 text-tertiary">账户</h2>
        <Field label="邮箱类型" value={EMAIL_TYPE_LABELS[profile.emailType] || profile.emailType} />
        <Field
          label="注册时间"
          value={profile.createdAt ? new Date(profile.createdAt).toLocaleString("zh-CN") : null}
        />
      </section>

      <section aria-label="修改密码">
        <h2 className="type-tech mb-3 text-tertiary">修改密码</h2>
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

      <section aria-label="第三方身份">
        <h2 className="type-tech mb-3 text-tertiary">第三方身份</h2>
        <div className="border-t border-hairline">
          <IdentityList />
        </div>
      </section>
      <section aria-label="退出登录">
        <h2 className="type-tech mb-3 text-tertiary">退出登录</h2>
        <Button variant="outline" onClick={handleLogout} disabled={logoutLoading}>
          {logoutLoading ? <DotLoading /> : "退出登录"}
        </Button>
      </section>
    </main>
  );
}
