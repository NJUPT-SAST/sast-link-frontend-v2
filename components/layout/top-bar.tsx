"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, User } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/admin";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TopBar() {
  const pathname = usePathname();
  const role = useUserProfileStore((state) => state.profile.role);
  // First admin-surface entry the role may open — admin lands on the overview,
  // lecturer on its read-only /admin/users. Keeps the entry and the nav in sync.
  const adminHref = ADMIN_NAV_ITEMS.find((item) => item.roles.includes(role))?.href;
  const homeLabel = pathname === "/home" ? "首页" : "返回首页";

  return (
    <TooltipProvider delayDuration={500}>
      <header className="fixed inset-x-0 top-0 z-10 flex h-16 items-center justify-between px-5 sm:px-8">
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
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/profile"
                aria-label="个人资料"
                className="grid size-10 place-items-center text-foreground/70 transition-[opacity,transform] hover:-translate-y-px hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2"
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
                  aria-label="管理面板"
                  className="grid size-10 place-items-center text-foreground/70 transition-[opacity,transform] hover:-translate-y-px hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2"
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
                aria-label="设置"
                className="grid size-10 place-items-center text-foreground/70 transition-[opacity,transform] hover:-translate-y-px hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2"
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
