"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { useUserProfileStore } from "@/store/use-user-profile-store";
import { getGreeting } from "@/lib/greeting";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  const profile = useUserProfileStore((state) => state.profile);
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateLabel = now.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const displayName = profile.nickname || profile.name || "NJUPTer";

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] snap-start flex-col items-center justify-center px-5 text-center sm:px-8">
      <div className="stagger-rise flex max-w-xl flex-col items-center gap-5">
        <div className="type-tech text-tertiary">{dateLabel}</div>
        <h1 className="type-title1" data-cursor-target>
          {greeting}，{displayName}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/profile">账户设置</Link>
          </Button>
        </div>
      </div>

      <a
        href="#profile-card"
        aria-label="查看个人名片"
        className="guide-bob absolute bottom-8 left-1/2 z-[1] -translate-x-1/2 text-foreground hover:[animation:none] hover:opacity-100"
      >
        <ChevronDown size={24} strokeWidth={1.75} />
      </a>
    </section>
  );
}
