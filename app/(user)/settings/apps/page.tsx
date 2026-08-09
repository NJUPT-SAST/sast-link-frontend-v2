"use client";

import { AuthorizedApps } from "@/components/user/authorized-apps";
import { BackButton } from "@/components/navigation/back-button";

export default function SettingsAppsPage() {
  return (
    <main className="pt-transition mx-auto flex w-full max-w-[760px] flex-col gap-10 px-5 pb-20 pt-14 sm:px-8">
      <BackButton fallback="/settings" />
      <section aria-label="已授权应用">
        <h2 className="type-tech mb-3 text-tertiary">已授权应用</h2>
        <AuthorizedApps />
      </section>
    </main>
  );
}
