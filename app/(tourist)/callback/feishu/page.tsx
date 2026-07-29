"use client";

import { Suspense } from "react";

import { OAuthCallbackContent } from "@/components/auth/oauth-callback-content";
import { LarkIcon } from "@/components/icons/brand-icons";

export default function FeishuCallbackPage() {
  return (
    <div className="grid min-h-screen w-full place-items-center px-6">
      <Suspense>
        <OAuthCallbackContent provider={{ name: "飞书", icon: <LarkIcon /> }} />
      </Suspense>
    </div>
  );
}
