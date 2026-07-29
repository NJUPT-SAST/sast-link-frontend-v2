"use client";

import { useEffect, useRef } from "react";

import { generateStars, drawStars, type Star } from "@/lib/visual/starfield";

const MAX_DPR = 2;

/** Full-viewport generative starfield: square pixel stars, three parallax
 *  layers, white on dark / black on light. reduced-motion renders a single
 *  static frame with no listeners. */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // jsdom and unsupported environments

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let raf = 0;
    let running = true;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const start = performance.now();

    const dpr = () => Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr());
      canvas.height = Math.floor(window.innerHeight * dpr());
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      // fresh seed per mount: every visit gets a different sky
      stars = generateStars((Math.random() * 2 ** 31) | 0, window.innerWidth, window.innerHeight);
    };

    const frame = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      drawStars(ctx, stars, {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: dpr(),
        timeSec: (performance.now() - start) / 1000,
        offsetX: current.x,
        offsetY: current.y,
        color: document.documentElement.classList.contains("dark") ? "#ffffff" : "#0a0a0a",
      });
      if (!reduced && running) raf = requestAnimationFrame(frame);
    };

    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running && !reduced) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    if (reduced) {
      frame(); // one static frame, no loop, no listeners
    } else {
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="starfield"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
