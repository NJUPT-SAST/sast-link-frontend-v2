"use client";

import Link from "next/link";

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
            <Link href="/settings">账户设置</Link>
          </Button>
        </div>
      </div>

      <a
        href="#profile-card"
        aria-label="查看个人名片"
        className="absolute bottom-8 left-1/2 z-[1] -translate-x-1/2 border-x-[10px] border-t-[14px] border-x-transparent border-t-foreground opacity-60 transition-[opacity,transform] hover:translate-y-1 hover:opacity-100"
      />
    </section>
  );
}
