"use client";

import { Suspense } from "react";

import { OAuthErrorContent } from "@/components/auth/oauth-error-content";

/**
 * Landing page for a failed third-party login. The backend's callback cannot
 * render a session, so it bounces the browser here with the business code and
 * its own fixed description (OAUTH_LOGIN_ERROR_REDIRECT).
 *
 * Without this route the static export falls through to /index.html and the
 * user sees the landing page while the URL still reads /oauth/error — which
 * looks like the login button simply did nothing.
 */
export default function OAuthErrorPage() {
  return (
    <div className="grid min-h-screen w-full place-items-center px-6">
      <Suspense>
        <OAuthErrorContent />
      </Suspense>
    </div>
  );
}
