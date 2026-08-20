"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { isLowEndDevice } from "@/components/visual/starfield";
import { LOGO_DATA_URL } from "@/lib/visual/brand-mark";
import {
  RAMP,
  buildField,
  computeAsciiGrid,
  luma601,
} from "@/lib/visual/ascii-field";

/** Canvas DPR cap; low-end devices force 1. */
const MAX_DPR = 2;
/** Repaint at most ~30fps — the grain crawls slowly, extra frames are waste. */
const FRAME_INTERVAL = 1000 / 30;
const FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Renders the brand mark as a living character field: the source is sampled
 *  to a coarse luminance grid, perturbed by a slow travelling wave, and
 *  error-diffused onto a short glyph ramp, so flat colour becomes a textured
 *  grain of mixed glyphs that crawls gently over the mark. The transparent
 *  background stays nearly empty — only faint grain — letting the page
 *  backdrop through.
 *
 *  Glyph size is fixed in CSS px: the mark keeps constant texture density
 *  and only changes resolution across viewports. Reduced-motion renders a
 *  single static frame. */
export function PhotoGlyphs({
  src = LOGO_DATA_URL,
  className,
}: {
  src?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // jsdom and other environments without a 2D context: silently leave blank.
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const lowEnd = isLowEndDevice();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Offscreen canvas: downsample the source to grid size to read luminance.
    const srcOff = document.createElement("canvas");
    let srcOffCtx: CanvasRenderingContext2D | null = null;
    try {
      srcOffCtx = srcOff.getContext("2d", { willReadFrequently: true });
    } catch {
      srcOffCtx = null;
    }

    const img = new Image();
    const startedAt = performance.now();
    const dpr = () => Math.min(window.devicePixelRatio || 1, lowEnd ? 1 : MAX_DPR);

    // Grid state, rebuilt on load/resize.
    let cols = 0;
    let rows = 0;
    let cellW = 0;
    let cellH = 0;
    let gray: Float32Array = new Float32Array(0);

    let raf = 0;
    let scheduled = 0;
    let lastDraw = 0;
    let running = true;
    let rafScheduled = false;

    const ink = () => {
      const token = getComputedStyle(document.documentElement).getPropertyValue(
        "--color-foreground",
      );
      return token.trim() || "#e8e8e8";
    };

    /** Sample the source into grid luminance (0..1). Runs only when the
     *  geometry changes; the per-frame wave animation works off this cache. */
    const resample = () => {
      if (!img.complete || img.naturalWidth === 0 || !srcOffCtx || !ctx) return false;

      const availW = canvas.clientWidth || window.innerWidth || 600;
      const fontSize = lowEnd ? 13 : 10;
      ctx.font = `${fontSize}px ${FONT_STACK}`;
      const charW = ctx.measureText("M").width;
      const grid = computeAsciiGrid(
        availW,
        img.naturalHeight / img.naturalWidth,
        charW,
        fontSize,
        lowEnd,
      );
      cols = grid.cols;
      rows = grid.rows;
      cellW = grid.cellW;
      cellH = grid.cellH;

      srcOff.width = cols;
      srcOff.height = rows;
      srcOffCtx.drawImage(img, 0, 0, cols, rows);
      const data = srcOffCtx.getImageData(0, 0, cols, rows).data;
      gray = new Float32Array(cols * rows);
      for (let i = 0; i < gray.length; i++) {
        const p = i * 4;
        // Composite over black: semi-transparent edge pixels darken by their
        // coverage, so the mark's outline feeds a real gradient to the field
        // instead of a hard full-bright cliff.
        gray[i] =
          (luma601(data[p], data[p + 1], data[p + 2]) / 255) * (data[p + 3] / 255);
      }

      const d = dpr();
      canvas.width = Math.max(1, Math.round(cols * cellW * d));
      canvas.height = Math.max(1, Math.round(rows * cellH * d));
      canvas.style.aspectRatio = `${cols * cellW} / ${rows * cellH}`;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.font = `${grid.fontSize}px ${FONT_STACK}`;
      ctx.textBaseline = "top";
      return true;
    };

    const drawFrame = (t: number) => {
      if (!ctx || gray.length === 0) return;
      const { idx, alpha } = buildField(gray, cols, rows, t);
      ctx.fillStyle = ink();
      ctx.clearRect(0, 0, cols * cellW, rows * cellH);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (alpha[i] === 0) continue;
          ctx.globalAlpha = alpha[i];
          ctx.fillText(RAMP[idx[i]], x * cellW, y * cellH);
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (t: number) => {
      rafScheduled = false;
      if (!reduced && running) {
        rafScheduled = true;
        raf = requestAnimationFrame(frame);
      }
      if (lastDraw !== 0 && t - lastDraw < FRAME_INTERVAL) return;
      lastDraw = t;
      drawFrame((t - startedAt) / 1000);
    };

    const schedule = () => {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(() => {
        if (resample()) drawFrame((performance.now() - startedAt) / 1000);
      });
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running && !rafScheduled && !reduced) {
        rafScheduled = true;
        lastDraw = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    // The ink follows the theme token; repaint on class flips (dark/light).
    const themeObserver = new MutationObserver(() => {
      if (gray.length > 0) drawFrame((performance.now() - startedAt) / 1000);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    img.onload = () => {
      if (!resample()) return;
      if (reduced) {
        drawFrame(0);
        return;
      }
      rafScheduled = true;
      raf = requestAnimationFrame(frame);
    };
    img.onerror = () => {
      /* Missing image: leave the canvas blank. */
    };

    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", onVisibility);
    img.src = src;

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scheduled);
      rafScheduled = false;
      themeObserver.disconnect();
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", onVisibility);
      img.onload = null;
      img.onerror = null;
      img.src = "";
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("block", className)}
    />
  );
}
