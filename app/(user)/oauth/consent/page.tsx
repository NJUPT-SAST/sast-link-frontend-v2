"use client";

import { Suspense } from "react";

import { OAuthConsentContent } from "@/components/auth/oauth-consent-content";

export default function OAuthConsentPage() {
  return (
    <div className="grid min-h-screen w-full place-items-center px-6">
      <Suspense>
        <OAuthConsentContent />
      </Suspense>
    </div>
  );
}
