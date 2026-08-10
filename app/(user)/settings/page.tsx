"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { logout } from "@/lib/api/auth";
import { getSession, clearSession } from "@/lib/token";
import { avatarFallbackChar, DEFAULT_AVATAR } from "@/lib/constants/profile";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { IdentityList } from "@/components/user/identity-list";
import { BoundEmailSection } from "@/components/user/bound-email-section";

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
    <main className="stagger-rise mx-auto flex w-full max-w-[860px] flex-col px-5 pb-20 pt-14 sm:px-10">
      <div className="flex flex-col gap-14 border border-hairline p-6 sm:p-10">
        <section aria-label="当前账号">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border border-foreground">
              <AvatarImage
                src={profile.avatar ?? DEFAULT_AVATAR}
                alt={profile.nickname || profile.name || "当前账号"}
              />
              <AvatarFallback>{avatarFallbackChar(profile)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium">
                {profile.nickname || profile.name || "未登录"}
              </div>
              <div className="truncate text-sm text-tertiary">{profile.loginEmail}</div>
            </div>
          </div>
        </section>

        <section aria-label="账号与安全">
          <h2 className="type-tech mb-3 text-tertiary">账号与安全</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings/password">修改密码</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? <DotLoading /> : "退出登录"}
            </Button>
          </div>
        </section>

        <section aria-label="关联账号">
          <h2 className="type-tech mb-3 text-tertiary">关联账号</h2>

          <h3 className="type-tech mb-3 mt-8 text-tertiary">第三方账号</h3>
          <div className="border-t border-hairline">
            <IdentityList actionable />
          </div>

          <h3 className="type-tech mb-3 mt-8 text-tertiary">绑定邮箱</h3>
          <div className="border-t border-hairline">
            <BoundEmailSection />
          </div>
        </section>

        <section aria-label="已授权应用">
          <h2 className="type-tech mb-3 text-tertiary">已授权应用</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings/apps">已授权应用</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
