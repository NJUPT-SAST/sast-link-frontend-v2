"use client";

import { ProfileCard } from "@/components/user/profile-card";

export default function HomePage() {
  return (
    <main className="w-full snap-y snap-mandatory overflow-y-auto">
      <section className="relative min-h-screen snap-start">
        <a
          href="#profile-card"
          aria-label="查看个人名片"
          className="absolute bottom-8 left-1/2 z-[1] -translate-x-1/2 border-x-[10px] border-t-[14px] border-x-transparent border-t-foreground opacity-60 transition-[opacity,transform] hover:translate-y-1 hover:opacity-100"
        />
      </section>
      <ProfileCard />
    </main>
  );
}
