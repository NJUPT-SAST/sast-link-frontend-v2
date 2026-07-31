"use client";

import { useFetchProfile } from "@/hooks/use-fetch-profile";
import { HomeHero } from "@/components/user/home-hero";
import { HomeSkeleton } from "@/components/user/home-skeleton";
import { ProfileCard } from "@/components/user/profile-card";

export default function HomePage() {
  const { isLoading } = useFetchProfile();

  return (
    <main className="w-full">
      {isLoading ? <HomeSkeleton /> : <HomeHero />}
      <ProfileCard />
    </main>
  );
}
