"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { TopBar } from "@/components/layout/top-bar";
import { AdminNav } from "@/components/admin/admin-nav";
import { DotLoading } from "@/components/ui/dot-loading";
import { canAccessAdminPath } from "@/components/admin/permissions";
import { AdminErrorState } from "@/components/admin/error-state";
import { Button } from "@/components/ui/button";
import { stashAuthNext } from "@/lib/auth-next";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useFetchProfile } from "@/hooks/use-fetch-profile";
import { useUserProfileStore } from "@/store/use-user-profile-store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useUserProfileStore((state) => state.profile.role);
  const status = useAuthSession();
  const { isLoading, error, mutate } = useFetchProfile();
  // Mirrors AdminNav's visibility rule: a role may only open routes its nav
  // entries allow. lecturer can reach /admin/users (read-only) but a direct URL
  // to /admin/oauth-clients must not render a page that will 403.
  const canAccessPath = canAccessAdminPath(pathname, role);
  const canOpenUsers = canAccessAdminPath("/admin/users", role);

  useEffect(() => {
    if (status === "unauthenticated") {
      stashAuthNext(
        window.location.pathname + window.location.search,
      );
      router.replace("/login");
      return;
    }
  }, [router, status]);

  // Profile fetch only fires once the session exists (profileKey() returns null
  // otherwise), so while the session bootstrap is in flight isLoading stays true
  // and this shell is what the visitor sees — never a role-gated page.
  if (status !== "authenticated" || isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <DotLoading />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <TopBar />
      <div className="pt-16">
        <AdminNav />
        <main
          key={pathname}
          className="stagger-rise mx-auto max-w-[1200px] px-5 pb-20 pt-8 sm:px-8"
        >
          {error ? <AdminErrorState onRetry={() => void mutate()} /> : canAccessPath ? children : (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <p role="alert" className="text-tertiary">当前账号无权访问此管理页面</p>
              <Button variant="outline" asChild>
                <Link href={canOpenUsers ? "/admin/users" : "/home"}>
                  {canOpenUsers ? "返回用户管理" : "返回首页"}
                </Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
