"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, User } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/admin";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TopBar() {
  const pathname = usePathname();
  const role = useUserProfileStore((state) => state.profile.role);
  const scrollDirection = useScrollDirection();
  // First admin-surface entry the role may open — admin lands on the overview,
  // lecturer on its read-only /admin/users. Keeps the entry and the nav in sync.
  const adminHref = ADMIN_NAV_ITEMS.find((item) => item.roles.includes(role))?.href;
  const homeLabel = pathname === "/home" ? "首页" : "返回首页";

  const [focusWithin, setFocusWithin] = useState(false);
  const isHidden = scrollDirection === "down" && !focusWithin;

  return (
    <TooltipProvider delayDuration={500}>
      <header
        onFocusCapture={() => setFocusWithin(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false);
        }}
        className="site-top-bar fixed inset-x-0 top-0 z-10 flex h-16 items-center justify-between bg-background/95 px-3 transition-transform duration-300 sm:px-8"
        style={{ transform: isHidden ? "translateY(-100%)" : "translateY(0)", transitionDuration: focusWithin ? "0ms" : undefined }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/home"
              aria-label={homeLabel}
              className="text-lg font-bold tracking-tight text-foreground transition-opacity hover:opacity-80"
            >
              SAST Link
            </Link>
          </TooltipTrigger>
          <TooltipContent>{homeLabel}</TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/profile"
                aria-current={pathname.startsWith("/profile") ? "page" : undefined}
                aria-label="个人资料"
                className="flex size-11 items-center justify-center text-foreground/70 aria-[current=page]:text-foreground aria-[current=page]:border-b aria-[current=page]:border-foreground transition-[opacity,transform] hover:-translate-y-px hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2"
              >
                <User className="size-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>个人资料</TooltipContent>
          </Tooltip>
          {adminHref && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={adminHref}
                  aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                  aria-label="管理面板"
                  className="flex size-11 items-center justify-center text-foreground/70 aria-[current=page]:text-foreground aria-[current=page]:border-b aria-[current=page]:border-foreground transition-[opacity,transform] hover:-translate-y-px hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2"
                >
                  <LayoutDashboard className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>管理面板</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                aria-current={pathname.startsWith("/settings") ? "page" : undefined}
                aria-label="设置"
                className="flex size-11 items-center justify-center text-foreground/70 aria-[current=page]:text-foreground aria-[current=page]:border-b aria-[current=page]:border-foreground transition-[opacity,transform] hover:-translate-y-px hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2"
              >
                <Settings className="size-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>设置</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
