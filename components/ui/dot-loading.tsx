"use client";

import { cn } from "@/lib/utils";

export function DotLoading({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-block h-2.5 w-2.5 animate-[bounce-dot_1s_linear_0s_infinite] bg-current" />
      <span className="inline-block h-2.5 w-2.5 animate-[bounce-dot_1s_linear_0.1s_infinite] bg-current" />
      <span className="inline-block h-2.5 w-2.5 animate-[bounce-dot_1s_linear_0.2s_infinite] bg-current" />
    </span>
  );
}
