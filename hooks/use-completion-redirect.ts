"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useFetchProfile } from "@/hooks/use-fetch-profile";
import { useUserProfileStore } from "@/store/use-user-profile-store";

// Cold-start completion check. A fresh tab restores its session only from the
// httpOnly cookie via /auth/refresh, which returns tokens but no `user` body,
// so the completion flag is unavailable at session-guard time — it only shows
// up once the profile is fetched. When a healthy route loads a profile that is
// still flagged incomplete (legacy migration debris), route those users to the
// guided completion page. This is a soft steering: a pending auth-next / a
// manual profile edit still wins, and the completion page itself is exempt so
// it cannot loop.
const EXEMPT_PATHS = ["/profile/complete", "/profile/edit"];

export function useCompletionRedirect() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const profile = useUserProfileStore((s) => s.profile);
  const needs = profile.profileNeedsCompletion && profile.incompleteFields.length > 0;

  const exempt = EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(p));

  useEffect(() => {
    if (!needs) return;
    if (exempt) return;
    // Steer only where the user can act on it; never on the path that carries
    // the completion form itself.
    router.replace("/profile/complete");
  }, [needs, exempt, router]);
}

/** Loads the profile on user-layout mount so the completion check has data. */
export function useUserLayoutProfile() {
  useFetchProfile();
}
