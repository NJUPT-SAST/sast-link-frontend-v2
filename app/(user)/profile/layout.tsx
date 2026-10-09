"use client";

import type { ReactNode } from "react";

import { TopBar } from "@/components/layout/top-bar";
import { ProfileLoadBoundary } from "@/components/user/profile-load-boundary";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileLoadBoundary>
      <div className="min-h-dvh">
      <TopBar />
      <div className="pt-16">{children}</div>
      </div>
    </ProfileLoadBoundary>
  );
}
