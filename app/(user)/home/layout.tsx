"use client";

import type { ReactNode } from "react";

import { TopBar } from "@/components/layout/top-bar";
import { useFetchProfile } from "@/hooks/use-fetch-profile";

export default function HomeLayout({ children }: { children: ReactNode }) {
  useFetchProfile();

  return (
    <div className="h-dvh snap-y snap-proximity overflow-y-auto overflow-x-clip scroll-smooth scroll-pt-16 pt-16">
      <TopBar />
      {children}
    </div>
  );
}
