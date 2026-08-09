"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AuthShellProps {
  children: ReactNode;
  className?: string;
  /** widen the form panel beyond the default 400px for long forms */
  wide?: boolean;
}

/** Centered single-column auth layout over the starfield. Logo sits in the
 *  top-left corner; the panel is centered with `m-auto` so a tall form still
 *  scrolls instead of pinning to the top edge. */
export function AuthShell({ children, className, wide = false }: AuthShellProps) {
  // Self-contained provider so the brand tooltip works without depending on
  // the app-level provider (e.g. when AuthShell is rendered in isolation).
  return (
    <TooltipProvider delayDuration={500}>
    <section className="flex min-h-screen w-full flex-col overflow-y-auto text-foreground">
      <div className="absolute left-5 top-5 sm:left-8 sm:top-7">
        {/* Plain text — an SVG logo's fixed width leaves a gap under the
            cursor's four-corner bracket, which reads as empty space. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/"
              aria-label="返回首页"
              className="text-lg font-bold tracking-tight text-foreground transition-opacity hover:opacity-80"
            >
              SAST Link
            </Link>
          </TooltipTrigger>
          <TooltipContent>返回首页</TooltipContent>
        </Tooltip>
      </div>
      <div className="m-auto flex w-full max-w-[calc(100%-40px)] flex-col items-center py-16 sm:max-w-[calc(100%-64px)]">
        <div className={cn("flex w-full flex-col", wide ? "max-w-[520px]" : "max-w-[400px]", className)}>
          {children}
        </div>
      </div>
    </section>
    </TooltipProvider>
  );
}
