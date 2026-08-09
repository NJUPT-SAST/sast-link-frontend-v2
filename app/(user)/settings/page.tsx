"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { logout } from "@/lib/api/auth";
import { getSession, clearSession } from "@/lib/token";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
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
          <div className="border-t border-hairline">
            <IdentityList actionable />
          </div>
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
