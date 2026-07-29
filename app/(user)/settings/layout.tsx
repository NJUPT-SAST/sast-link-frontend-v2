"use client";

import type { ReactNode } from "react";

import { TopBar } from "@/components/layout/top-bar";
import { useFetchProfile } from "@/hooks/use-fetch-profile";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  useFetchProfile();

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="pt-16">{children}</div>
    </div>
  );
}
