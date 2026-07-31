"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getSession } from "@/lib/token";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const check = () => {
      if (!getSession()) router.replace("/login");
    };
    check();
    // Cross-tab: another tab logged out and cleared the token.
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [router]);

  return <>{children}</>;
}
