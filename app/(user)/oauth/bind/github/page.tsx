"use client";

import { Suspense } from "react";

import { OAuthBindContent } from "@/components/auth/oauth-bind-content";
import { GithubIcon } from "@/components/icons/brand-icons";

export default function GithubBindPage() {
  return (
    <div className="grid min-h-screen w-full place-items-center px-6">
      <Suspense>
        <OAuthBindContent
          provider="github"
          providerName="GitHub"
          icon={<GithubIcon />}
        />
      </Suspense>
    </div>
  );
}
