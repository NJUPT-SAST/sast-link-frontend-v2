import { useEffect } from "react";

/**
 * Sets `data-cursor-hidden` on the document root while active. The custom
 * TargetCursor (when enabled) hides itself while the flag is present, so
 * nothing is drawn over fullscreen overlays — survey intro, login-success
 * flare. No cursor is shown at all during the animation; the reticle returns
 * once the flag clears.
 */
export function useHideCursor(active = true) {
  useEffect(() => {
    if (!active) return;
    document.documentElement.setAttribute("data-cursor-hidden", "");
    return () => document.documentElement.removeAttribute("data-cursor-hidden");
  }, [active]);
}
