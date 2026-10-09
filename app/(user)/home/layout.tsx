"use client";

import type { ReactNode } from "react";

import { TopBar } from "@/components/layout/top-bar";
import { ProfileLoadBoundary } from "@/components/user/profile-load-boundary";
import { HomeSkeleton } from "@/components/user/home-skeleton";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileLoadBoundary fallback={<HomeSkeleton />}>
      <div className="h-dvh snap-y snap-proximity overflow-y-auto overflow-x-clip scroll-smooth scroll-pt-16 pt-16">
      <TopBar />
      {children}
      </div>
    </ProfileLoadBoundary>
  );
}
