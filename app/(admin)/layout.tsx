"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { TopBar } from "@/components/layout/top-bar";
import { AdminNav } from "@/components/admin/admin-nav";
import { DotLoading } from "@/components/ui/dot-loading";
import { getSession } from "@/lib/token";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/admin";
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
  const hasSession = getSession() !== null;
  const { isLoading, error } = useFetchProfile();
  // Mirrors AdminNav's visibility rule: a role may only open routes its nav
  // entries allow. lecturer can reach /admin/users (read-only) but a direct URL
  // to /admin/oauth-clients must not render a page that will 403.
  const canAccessPath = ADMIN_NAV_ITEMS.some(
    (item) =>
      item.roles.includes(role) &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }
    if (!isLoading && (!canAccessPath || error)) {
      router.replace("/home");
    }
  }, [router, hasSession, isLoading, canAccessPath, error]);

  if (!hasSession || isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <DotLoading />
      </div>
    );
  }

  if (!canAccessPath || error) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="pt-16">
        <AdminNav />
        <main
          key={pathname}
          className="stagger-rise mx-auto max-w-[1200px] px-5 pb-20 pt-8 sm:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
