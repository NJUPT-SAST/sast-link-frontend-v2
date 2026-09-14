"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { useUserProfileStore } from "@/store/use-user-profile-store";
import type { UserRole } from "@/lib/api/types";
import { getGreeting } from "@/lib/greeting";
import { Button } from "@/components/ui/button";

/** Recruitment lives on a separate site; the home hero's cross-site exit is
 *  for freshmen and members. The id gate keeps the store's initial profile
 *  (id 0, role "freshman") from flashing the button before the real profile
 *  lands. */
const RECRUITMENT_ROLES: ReadonlySet<UserRole> = new Set(["freshman", "member"]);
const RECRUITMENT_SITE_URL = "https://people.sast.fun";

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
    <section className="relative flex min-h-[calc(100dvh-4rem)] snap-start flex-col items-center justify-center px-5 text-center sm:px-8">
      <div className="stagger-rise flex max-w-xl flex-col items-center gap-5">
        <div className="type-tech text-tertiary">{dateLabel}</div>
        <h1 className="type-title1" data-cursor-target>
          {greeting}，{displayName}
        </h1>
        <div className="mt-4 flex flex-col items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/profile">个人资料</Link>
          </Button>
          {profile.id !== 0 && RECRUITMENT_ROLES.has(profile.role) && (
            <Button variant="outline" asChild>
              <a href={RECRUITMENT_SITE_URL} target="_blank" rel="noreferrer">
                进入招新平台
              </a>
            </Button>
          )}
        </div>
      </div>

      <a
        href="#profile-card"
        aria-label="查看个人名片"
        onClick={(event) => {
          // Anchor navigation to the same #profile-card hash does not re-scroll,
          // and scrollIntoView's scroll-padding / scroll-margin math is
          // unreliable on iOS Safari inside the nested scroll-snap container.
          // Compute the target scroll position directly so the card centers.
          event.preventDefault();
          const card = document.getElementById("profile-card");
          const container = card?.closest(".snap-y") as HTMLElement | null;
          if (card && container) {
            const rect = card.getBoundingClientRect();
            container.scrollTo({
              top: container.scrollTop + rect.top - (container.clientHeight - rect.height) / 2,
              behavior: "smooth",
            });
          }
        }}
        className="guide-bob absolute bottom-8 left-1/2 z-[1] -translate-x-1/2 text-foreground hover:[animation:none] hover:opacity-100"
      >
        <ChevronDown size={24} strokeWidth={1.75} />
      </a>
    </section>
  );
}
