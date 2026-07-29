"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

import { Logo } from "@/components/icons/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex h-16 items-center justify-between px-5 sm:px-8">
      <Link href="/home" aria-label="返回首页" className="inline-flex shrink-0 text-foreground transition-opacity hover:opacity-80">
        <Logo />
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/settings"
          aria-label="设置"
          className="grid size-10 place-items-center text-foreground/70 transition-[opacity,transform] hover:-translate-y-px hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2"
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </header>
  );
}
