"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FilterDrawerProps {
  /** Always-visible controls (e.g. a keyword box), rendered before the toggle. */
  lead?: React.ReactNode;
  /** Controls collapsed behind the toggle on narrow viewports. */
  children: React.ReactNode;
  /** Submit / reset buttons, always visible. */
  actions: React.ReactNode;
  /** How many of the collapsible filters are currently set, shown on the toggle. */
  activeCount: number;
  /** Grid track definition applied from xl, where everything sits on one row. */
  rowClass: string;
  /** Accessible name for the toggle button. */
  toggleLabel?: string;
}

/**
 * Responsive filter layout.
 *
 * Below xl the secondary filters collapse behind a 筛选 toggle, so a six-field
 * filter block does not push the list off the first screen on a phone; a keyword
 * box can stay visible through `lead`. From xl everything is one grid row again.
 *
 * The collapsed fields stay mounted inside the same <form> (hidden with CSS, not
 * unmounted) so react-hook-form keeps their registered values — collapsing the
 * panel must never silently drop an active filter. The badge on the toggle is what
 * tells the admin a hidden filter is still in effect.
 */
export function FilterDrawer({
  lead,
  children,
  actions,
  activeCount,
  rowClass,
  toggleLabel = "筛选",
}: FilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex flex-col gap-3", rowClass)}>
      {lead}
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="admin-filter-panel"
        className="h-11 w-full xl:hidden"
      >
        <SlidersHorizontalIcon className="size-4" />
        {toggleLabel}
        {activeCount > 0 && (
          <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-xs text-background">
            {activeCount}
          </span>
        )}
      </Button>
      {/* xl:contents dissolves this wrapper so the fields become direct grid
          children of the row again and the desktop track definition applies. */}
      <div
        id="admin-filter-panel"
        className={cn(
          open ? "flex flex-col gap-3" : "hidden",
          "xl:contents",
        )}
      >
        {children}
      </div>
      {actions}
    </div>
  );
}
