"use client";

import type { ReactNode } from "react";
import { useFetchProfile } from "@/hooks/use-fetch-profile";
import { DotLoading } from "@/components/ui/dot-loading";
import { AccountLoadError } from "@/components/user/account-load-error";

/** Keep unavailable account data out of the page; background failures retain edits. */
export function ProfileLoadBoundary({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { data, error, isValidating, mutate } = useFetchProfile();
  if (!data) {
    if (error) return (
      <main className="mx-auto w-full max-w-[760px] px-5 pt-20 sm:px-8">
        <AccountLoadError title="个人资料加载失败" error={error} retrying={isValidating} onRetry={mutate} />
      </main>
    );
    return fallback ?? <div role="status" className="grid min-h-screen place-items-center" aria-label="正在加载个人资料"><DotLoading /></div>;
  }
  return <>
    {error && <div className="mx-auto w-full max-w-[760px] px-5 pt-16 sm:px-8">
      <AccountLoadError title="资料更新失败，已保留当前内容" error={error} retrying={isValidating} onRetry={mutate} />
    </div>}
    {children}
  </>;
}
