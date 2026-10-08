"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { OAuthCallbackContent } from "@/components/auth/oauth-callback-content";
import { GithubIcon, LarkIcon } from "@/components/icons/brand-icons";

/** Fallback provider display for the shared landing page. */
function useProviderMeta() {
  const searchParams = useSearchParams();
  switch (searchParams.get("provider")) {
    case "lark":
      return { name: "飞书", icon: <LarkIcon /> };
    case "github":
      return { name: "GitHub", icon: <GithubIcon /> };
    default:
      return { name: "第三方", icon: null };
  }
}

export default function CallbackClient() {
  const provider = useProviderMeta();
  return (
    <div className="grid min-h-dvh w-full place-items-center px-6">
      <Suspense>
        <OAuthCallbackContent provider={provider} />
      </Suspense>
    </div>
  );
}
