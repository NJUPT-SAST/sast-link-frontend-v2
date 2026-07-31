"use client";

import { Suspense } from "react";

import { OAuthBindContent } from "@/components/auth/oauth-bind-content";
import { LarkIcon } from "@/components/icons/brand-icons";

export default function LarkBindPage() {
  return (
    <div className="grid min-h-screen w-full place-items-center px-6">
      <Suspense>
        <OAuthBindContent
          provider="lark"
          providerName="飞书"
          icon={<LarkIcon />}
        />
      </Suspense>
    </div>
  );
}
