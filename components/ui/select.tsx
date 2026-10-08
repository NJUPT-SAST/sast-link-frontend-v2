"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/** Select with a consistently positioned chevron — native arrows hug the right
 *  edge and can read as clipped, and CSS background arrows are fragile. */
export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      {/* pr-9 keeps text clear of the absolutely-positioned chevron
          (right-3 + size-4) — same 2.25rem the old global CSS arrow used. */}
      <select {...props} className={cn("w-full appearance-none pr-9", className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
    </div>
  );
}
