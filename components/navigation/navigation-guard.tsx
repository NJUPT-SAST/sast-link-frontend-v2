"use client";

import { useEffect, type MouseEvent, type ReactNode } from "react";

import { useNavigationGuardStore } from "@/store/use-navigation-guard-store";

const LEAVE_CONFIRM_MESSAGE = "有未保存的修改，确定要离开吗？";

/**
 * Layout-level guard for in-app SPA navigations (TopBar links) that
 * beforeunload cannot see. Capture-phase so it runs before the link's own
 * handling; browser back is covered by the popstate listener below.
 * External links are left alone — beforeunload already covers those.
 */
export function NavigationGuard({ children }: { children: ReactNode }) {
  const blocked = useNavigationGuardStore((state) => state.blocked);

  useEffect(() => {
    const handlePopState = () => {
      const { blocked: isBlocked, guardUrl } =
        useNavigationGuardStore.getState();
      // History already moved back by the time popstate fires; the page
      // component is still mounted, so only the address bar needs restoring.
      if (!isBlocked) return;
      if (window.confirm(LEAVE_CONFIRM_MESSAGE)) {
        useNavigationGuardStore.getState().setBlocked(false);
        return;
      }
      if (guardUrl) window.history.pushState(null, "", guardUrl);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!blocked) return;
    const anchor = (event.target as Element | null)?.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    // No href / empty href means the anchor cannot navigate anywhere.
    if (!href) return;
    const target = new URL(anchor.href, window.location.href);
    if (target.origin !== window.location.origin) return;
    if (!window.confirm(LEAVE_CONFIRM_MESSAGE)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Leaving for good — drop the guard so the next page mounts clean.
    useNavigationGuardStore.getState().setBlocked(false);
  };

  return (
    <div onClickCapture={handleClickCapture}>{children}</div>
  );
}
