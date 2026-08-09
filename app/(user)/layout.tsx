"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getSession } from "@/lib/token";
import { stashAuthNext } from "@/lib/auth-next";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const check = () => {
      if (!getSession()) {
        // Remember where the user was heading so login can bring them back
        // (e.g. an OAuth consent request). Path + query only — the stash
        // rejects full URLs, so a same-origin href must be stripped first.
        stashAuthNext(
          window.location.pathname + window.location.search,
        );
        router.replace("/login");
      }
    };
    check();
    // Cross-tab: another tab logged out and cleared the token.
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [router]);

  return <>{children}</>;
}
