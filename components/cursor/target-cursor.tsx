"use client";

import { useEffect, useRef, useState } from "react";

import { bracketCorners, lerp, resolveLockTarget, type BracketCorners, type Point } from "@/lib/cursor/cursor-math";

const CORNER_SIZE = 12;
const IDLE_GAP = 18;
const LOCK_PAD = 3;
const FOLLOW = 0.5;
const CORNER_FOLLOW = 0.2;
const PARALLAX_STRENGTH = 0.025;
const SPEED_SPREAD = 0.35; // idle brackets breathe outward while moving fast
const LEAN_MAX = 8; // idle dot leans toward the movement direction while moving
const PRESS_PULL = 0.35; // corners close toward center while pressed
const PRESS_IN = 0.45; // press attack speed
const PRESS_OUT = 0.12; // release rebound speed
const IDLE_MS = 120; // pause the rAF loop once the pointer has been still this long

const ARM_OFFSETS: readonly Point[] = [
  { x: 0, y: 0 },
  { x: -CORNER_SIZE, y: 0 },
  { x: 0, y: -CORNER_SIZE },
  { x: -CORNER_SIZE, y: -CORNER_SIZE },
];

/** Target cursor: a still idle reticle that follows the pointer, expands
 * onto explicit targets, and keeps a small pointer-relative drift while
 * moving inside a locked target. */
export function TargetCursor() {
  const [enabled, setEnabled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<HTMLDivElement>(null);
  const blRef = useRef<HTMLDivElement>(null);
  const brRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fine && !reduced) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current!;
    const dot = dotRef.current!;
    const arms = [tlRef.current!, trRef.current!, blRef.current!, brRef.current!];
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const shown = { ...pointer };
    let target: Element | null = null;
    const corners: BracketCorners = bracketCorners(
      { x: pointer.x, y: pointer.y, width: 0, height: 0 },
      IDLE_GAP,
    );
    let speed = 0; // 0..1 smoothed pointer velocity, drives idle spread
    let press = 0; // 0..1 press amount, lerped both ways
    let pressed = false;
    let raf = 0;
    let lastMove = performance.now();
    let rectCache: DOMRect | null = null;

    document.documentElement.classList.add("tc-active");

    // While a fullscreen overlay (survey intro, login flare) is up, the
    // reticle is noise — hide it and let the system cursor through.
    const isHiddenByOverlay = () => document.documentElement.hasAttribute("data-cursor-hidden");

    const setTarget = (next: Element | null) => {
      if (next === target) return;
      target = next;
      root.dataset.state = target ? "locked" : "idle";
    };

    // Resume a paused loop. Called from every relevant input event so an idle
    // page starts drawing again the instant the user interacts.
    const wake = () => {
      if (raf === 0) raf = requestAnimationFrame(frame);
    };

    // Cache the locked target's box so the loop never forces layout per frame;
    // refreshed on target change, window resize and scroll.
    const refreshRect = () => {
      rectCache =
        target && document.body.contains(target) ? target.getBoundingClientRect() : null;
    };

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      lastMove = performance.now();
      wake();
    };

    const onOver = (event: MouseEvent) => {
      setTarget(resolveLockTarget(event.target));
      refreshRect();
      wake();
    };
    const onOut = (event: MouseEvent) => {
      if (!target) return;
      const related = event.relatedTarget;
      if (related instanceof Node && target.contains(related)) return;
      setTarget(resolveLockTarget(related));
      refreshRect();
      wake();
    };

    const onDown = () => { pressed = true; wake(); };
    const onUp = () => { pressed = false; wake(); };

    // Function declaration (hoisted) so the wake/refreshRect helpers defined
    // above can reference the loop without a use-before-define violation.
    function frame() {
      const dx = pointer.x - shown.x;
      const dy = pointer.y - shown.y;
      const instant = Math.min(Math.hypot(dx, dy) / 60, 1);
      speed = lerp(speed, instant, instant > speed ? 0.3 : 0.08);
      press = lerp(press, pressed ? 1 : 0, pressed ? PRESS_IN : PRESS_OUT);
      shown.x = lerp(shown.x, pointer.x, FOLLOW);
      shown.y = lerp(shown.y, pointer.y, FOLLOW);
      root.style.transform = `translate(${shown.x}px, ${shown.y}px)`;

      const hiddenByOverlay = isHiddenByOverlay();
      if (hiddenByOverlay) {
        // Overlay playing: drop the locked target and hide the reticle
        // entirely (system cursor stays hidden too — nothing on screen).
        // Pause the loop; the MutationObserver on data-cursor-hidden wakes it
        // once the overlay is gone.
        setTarget(null);
        root.style.visibility = "hidden";
        raf = 0;
        return;
      }

      const wasHidden = root.style.visibility === "hidden";
      if (wasHidden) root.style.visibility = "";

      let desired: BracketCorners;
      let centerInRoot: Point = { x: 0, y: 0 };
      if (target && document.body.contains(target)) {
        // rectCache is refreshed on target change, resize and scroll — never
        // read here per frame, which would force a synchronous layout.
        const rect = rectCache ?? target.getBoundingClientRect();
        rectCache = rect;
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        centerInRoot = { x: center.x - shown.x, y: center.y - shown.y };
        const drift = {
          x: (pointer.x - center.x) * PARALLAX_STRENGTH,
          y: (pointer.y - center.y) * PARALLAX_STRENGTH,
        };
        const absolute = bracketCorners(
          { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
          LOCK_PAD,
        );
        desired = {
          tl: { x: absolute.tl.x - shown.x + drift.x, y: absolute.tl.y - shown.y + drift.y },
          tr: { x: absolute.tr.x - shown.x + drift.x, y: absolute.tr.y - shown.y + drift.y },
          bl: { x: absolute.bl.x - shown.x + drift.x, y: absolute.bl.y - shown.y + drift.y },
          br: { x: absolute.br.x - shown.x + drift.x, y: absolute.br.y - shown.y + drift.y },
        };
      } else {
        if (target) setTarget(null);
        const gap = IDLE_GAP * (1 + speed * SPEED_SPREAD);
        desired = bracketCorners({ x: 0, y: 0, width: 0, height: 0 }, gap);
      }

      // Expanded (locked) targets keep their bracket size on press — shrinking
      // a locked frame on click reads as a glitch, so only idle reticles contract.
      const pull = target ? 0 : press * PRESS_PULL;
      (Object.keys(corners) as Array<keyof BracketCorners>).forEach((key, index) => {
        corners[key].x = lerp(corners[key].x, desired[key].x, CORNER_FOLLOW);
        corners[key].y = lerp(corners[key].y, desired[key].y, CORNER_FOLLOW);
        const px = lerp(corners[key].x, centerInRoot.x, pull);
        const py = lerp(corners[key].y, centerInRoot.y, pull);
        arms[index].style.transform = `translate(${px + ARM_OFFSETS[index].x}px, ${py + ARM_OFFSETS[index].y}px)`;
      });
      // Lean the idle dot toward the movement direction for a physical drag feel;
      // the dot is hidden while locked, so this only shows when moving free.
      const lean = speed * LEAN_MAX;
      const dlen = Math.hypot(dx, dy);
      const lx = dlen > 0.001 ? (dx / dlen) * lean : 0;
      const ly = dlen > 0.001 ? (dy / dlen) * lean : 0;
      dot.style.opacity = target ? "0" : "1";
      dot.style.transform = `translate(calc(-50% + ${lx}px), calc(-50% + ${ly}px)) scale(${1 + press * 0.6})`;

      // With no locked target and a still pointer the reticle is frozen — drop
      // the loop until some input wakes it. This is the main CPU win on idle
      // pages: zero frames instead of 60/s.
      if (!target && performance.now() - lastMove > IDLE_MS) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onUp);
    // The locked bracket must track scroll/resize without re-reading layout
    // every frame — just refresh the cached box.
    window.addEventListener("resize", refreshRect);
    window.addEventListener("scroll", refreshRect, { capture: true, passive: true });
    // An overlay can appear/disappear while the pointer is still; wake the
    // loop so the reticle hides and re-appears with it.
    const observer = new MutationObserver(() => wake());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-cursor-hidden"],
    });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.documentElement.classList.remove("tc-active");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onUp);
      window.removeEventListener("resize", refreshRect);
      window.removeEventListener("scroll", refreshRect, { capture: true });
    };
  }, [enabled]);

  if (!enabled) return null;

  const armClass = "pointer-events-none absolute left-0 top-0 size-3";
  return (
    <div ref={rootRef} aria-hidden="true" data-testid="target-cursor" data-state="idle" className="pointer-events-none fixed left-0 top-0 z-[9999] size-0 mix-blend-difference text-white">
      <div ref={dotRef} className="pointer-events-none absolute left-0 top-0 size-1 rounded-full bg-current" />
      <div ref={tlRef} className={`${armClass} border-l-[3px] border-t-[3px] border-current`} />
      <div ref={trRef} className={`${armClass} border-r-[3px] border-t-[3px] border-current`} />
      <div ref={blRef} className={`${armClass} border-b-[3px] border-l-[3px] border-current`} />
      <div ref={brRef} className={`${armClass} border-b-[3px] border-r-[3px] border-current`} />
    </div>
  );
}
