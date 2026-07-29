"use client";

import { Suspense } from "react";

import { OAuthCallbackContent } from "@/components/auth/oauth-callback-content";
import { GithubIcon } from "@/components/icons/brand-icons";

export default function GithubCallbackPage() {
  return (
    <div className="grid min-h-screen w-full place-items-center px-6">
      <Suspense>
        <OAuthCallbackContent provider={{ name: "GitHub", icon: <GithubIcon /> }} />
      </Suspense>
    </div>
  );
}
