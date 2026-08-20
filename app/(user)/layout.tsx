"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { DotLoading } from "@/components/ui/dot-loading";
import { stashAuthNext } from "@/lib/auth-next";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useCompletionRedirect, useUserLayoutProfile } from "@/hooks/use-completion-redirect";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const status = useAuthSession();
  // Hydrate the profile at layout scope so the cold-start completion check
  // (below) has data as soon as the session resolves.
  useUserLayoutProfile();
  useCompletionRedirect();

  useEffect(() => {
    if (status === "unauthenticated") {
      // Remember where the user was heading so login can bring them back
      // (e.g. an OAuth consent request). Path + query only — the stash
      // rejects full URLs, so a same-origin href must be stripped first.
      stashAuthNext(
        window.location.pathname + window.location.search,
      );
      router.replace("/login");
    }
  }, [router, status]);

  // Never render protected content until we know the visitor is allowed in —
  // a new tab with only the session cookie would otherwise flash a signed-out
  // shell before the /auth/refresh cookie probe resolves.
  if (status !== "authenticated") {
    return (
      <div className="grid min-h-screen place-items-center">
        <DotLoading />
      </div>
    );
  }

  return <>{children}</>;
}
