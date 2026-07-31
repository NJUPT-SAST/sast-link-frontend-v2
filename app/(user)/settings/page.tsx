"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { logout } from "@/lib/api/auth";
import { getSession, clearSession } from "@/lib/token";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { avatarFallbackChar, DEFAULT_AVATAR, ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { IdentityList } from "@/components/user/identity-list";
import { BoundEmailSection } from "@/components/user/bound-email-section";

const DEPARTMENT_LABELS: Record<string, string> = {
  software: "软件研发部",
  media: "多媒体部",
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

export default function SettingsPage() {
  const profile = useUserProfileStore((state) => state.profile);
  const resetProfile = useUserProfileStore((state) => state.resetProfile);
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const session = getSession();
      if (session) await logout(session.refreshToken);
    } catch {
      /* fire and forget — local cleanup always runs */
    }
    clearSession();
    if (profile.loginEmail) useUserListStore.getState().removeAccount(profile.loginEmail);
    resetProfile();
    router.replace("/login");
  };

  return (
    <main className="stagger-rise mx-auto flex w-full max-w-[760px] flex-col gap-14 px-5 pb-20 pt-14 sm:px-8">
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
        <Field label="注册邮箱" value={profile.loginEmail} />
        <Field label="手机号" value={profile.phoneNumber} />
        <Field label="QQ" value={profile.qqNumber} />
        <Field label="博客" value={profile.blogUrl} />
        <Field label="GitHub" value={profile.githubUrl} />
      </section>

      <section aria-label="绑定邮箱">
        <h2 className="type-tech mb-3 text-tertiary">绑定邮箱</h2>
        <BoundEmailSection />
      </section>

      <section aria-label="修改密码">
        <h2 className="type-tech mb-3 text-tertiary">修改密码</h2>
        <Link
          href="/settings/password"
          className="flex min-h-[44px] items-center justify-between border-t border-hairline text-sm"
        >
          修改密码
          <ChevronRight size={16} className="text-tertiary" />
        </Link>
      </section>

      <section aria-label="第三方身份">
        <h2 className="type-tech mb-3 text-tertiary">第三方身份</h2>
        <div className="border-t border-hairline">
          <IdentityList actionable />
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
