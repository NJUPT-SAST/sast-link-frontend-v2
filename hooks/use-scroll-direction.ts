"use client";

import { useEffect, useRef, useState } from "react";

type ScrollDirection = "up" | "down" | null;

export function useScrollDirection(threshold = 10) {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  // A ref, not state: the last accepted position is bookkeeping, and putting it
  // in the effect's deps would tear down and re-attach the scroll listener on
  // every accepted scroll step.
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let rafId = 0;
    let ticking = false;

    const updateScrollDirection = () => {
      ticking = false;
      const scrollY = window.scrollY;
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight;

      // Rubber-banding (iOS / mobile elastic edges) reports scrollY outside
      // the document: negative above the top, past maxScrollY below the
      // bottom. The bounce-back then reads as a directional scroll — at the
      // top it hides the bar with no further scrolling to bring it back,
      // stranding the page's only navigation. Pin the bar visible whenever the
      // reported position sits at or beyond a boundary, and clamp the bookmark
      // so the bounce does not leak into the next real comparison.
      if (scrollY <= 0 || scrollY >= maxScrollY) {
        lastScrollYRef.current = Math.min(
          Math.max(scrollY, 0),
          Math.max(maxScrollY, 0),
        );
        setScrollDirection("up");
        return;
      }

      if (Math.abs(scrollY - lastScrollYRef.current) < threshold) return;

      setScrollDirection(scrollY > lastScrollYRef.current ? "down" : "up");
      lastScrollYRef.current = scrollY;
    };

    const onScroll = () => {
      if (!ticking) {
        rafId = window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [threshold]);

  return scrollDirection;
}
