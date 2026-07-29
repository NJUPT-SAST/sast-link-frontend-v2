"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/icons/logo";

interface AuthShellProps {
  /** mono step marker, e.g. "Sign in / 01" */
  tech: string;
  children: ReactNode;
  className?: string;
}

/** Split-screen auth layout. Left: logo + step marker over the starfield.
 *  Right: the form panel. minmax(0,…) keeps the ticker content from
 *  blowing the grid tracks out of the viewport. */
export function AuthShell({ tech, children, className }: AuthShellProps) {
  return (
    <section className="grid min-h-screen w-full text-foreground md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="relative hidden overflow-hidden md:flex md:flex-col">
        <div className="px-16 pt-14">
          <Link href="/" aria-label="返回首页" className="inline-flex text-foreground transition-opacity hover:opacity-80">
            <Logo />
          </Link>
        </div>
        <p className="type-tech mt-auto px-16 pb-16 text-tertiary">{tech}</p>
      </div>

      <div className="flex items-center justify-center overflow-y-auto border-l border-hairline bg-background/70 backdrop-blur-md max-md:border-l-0">
        <div className={cn("flex w-[400px] max-w-[calc(100%-64px)] flex-col py-12", className)}>
          <div className="mb-8 md:hidden">
            <Link href="/" aria-label="返回首页" className="inline-flex text-foreground transition-opacity hover:opacity-80">
              <Logo />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

