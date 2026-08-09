"use client";

import { useEffect, useState } from "react";

import { useFetchProfile } from "@/hooks/use-fetch-profile";
import { HomeHero } from "@/components/user/home-hero";
import { HomeSkeleton } from "@/components/user/home-skeleton";
import { ProfileCard } from "@/components/user/profile-card";

export default function HomePage() {
  const { isLoading } = useFetchProfile();

  // The static build has no client session, so its SWR key is null and
  // `isLoading` is false — it would prerender the hero while the first client
  // render (session present, fetch just started) shows the skeleton. Holding
  // the skeleton until after mount keeps both sides on the same branch.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client gate, see above
  useEffect(() => setMounted(true), []);

  if (!mounted || isLoading) {
    return (
      <main className="w-full">
        <HomeSkeleton />
      </main>
    );
  }

  return (
    <main className="w-full">
      <HomeHero />
      <ProfileCard />
    </main>
  );
}
