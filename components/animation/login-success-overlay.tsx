"use client";

import { useEffect } from "react";

interface LoginSuccessOverlayProps {
  onDone: () => void;
}

/**
 * Brief full-screen overlay that plays after login success.
 * A centre flare → fade transition, distinct from the pt-in slide used
 * during auth step changes.
 */
export function LoginSuccessOverlay({ onDone }: LoginSuccessOverlayProps) {
  useEffect(() => {
    const id = setTimeout(onDone, 700);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9998] flex items-center justify-center"
    >
      {/* scrim — fades in then out */}
      <div className="absolute inset-0 animate-[ls-scrim_0.7s_ease-out_forwards] bg-foreground" />
      {/* centre flare — brief bright pulse before dissolve */}
      <div className="relative size-40 animate-[ls-flare_0.7s_ease-out_forwards] rounded-full bg-foreground blur-2xl" />
    </div>
  );
}
