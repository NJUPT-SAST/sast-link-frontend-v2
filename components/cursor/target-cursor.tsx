"use client";

import { useEffect, useRef, useState } from "react";

import { bracketCorners, lerp, resolveLockTarget, type BracketCorners, type Point } from "@/lib/cursor/cursor-math";

const CORNER_SIZE = 12;
const IDLE_GAP = 18;
const LOCK_PAD = 3;
const SHELL_FOLLOW = 0.5; // bracket shell tracks the pointer slowly
const DOT_FOLLOW = 0.6; // dot leads the shell only slightly — too eager reads as twitchy
const MAX_DOT_LEAD = 4; // px — cap the dot's lead so it never sits far off-center
const IDLE_CORNER_FOLLOW = 0.4; // corners snap back faster after leaving a locked target
const CORNER_FOLLOW = 0.2;
const PARALLAX_STRENGTH = 0.025;
const SPEED_SPREAD = 0.35; // idle brackets breathe outward while moving fast
const PRESS_PULL = 0.35; // corners close toward center while pressed
const LOCKED_PULL = 0.5; // locked targets still react on press, but more gently
const PRESS_IN = 0.45; // press attack speed
const PRESS_OUT = 0.12; // release rebound speed
const IDLE_MS = 120; // pause the rAF loop once the pointer has been still this long
const SETTLE_EPS = 0.5; // px — snap the shell/dot to the pointer once within this

const CORNER_KEYS = ["tl", "tr", "bl", "br"] as const;

const ARM_OFFSETS: readonly Point[] = [
  { x: 0, y: 0 },
  { x: -CORNER_SIZE, y: 0 },
  { x: 0, y: -CORNER_SIZE },
  { x: -CORNER_SIZE, y: -CORNER_SIZE },
];

/** Target cursor: a still idle reticle that follows the pointer, expands
 *  onto explicit targets, and keeps a small pointer-relative drift while
 *  moving inside a locked target. Each corner carries a subtle outward/inward
 *  breathing animation (GPU, via CSS) so the reticle stays alive even when the
 *  JS rAF loop has paused on an idle pointer. */
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
    const shell = { ...pointer };
    const dotShown = { ...pointer };
    const docBody = document.body;
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
    let lastDotHidden = false;
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
        target && docBody.contains(target) ? target.getBoundingClientRect() : null;
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
      // The bracket shell tracks the pointer slowly (SHELL_FOLLOW); the dot
      // tracks faster and leads it by at most MAX_DOT_LEAD px — a physical lead
      // small enough to never read as an off-center "snap back" on settle.
      const dx = pointer.x - shell.x;
      const dy = pointer.y - shell.y;
      const instant = Math.min(Math.hypot(dx, dy) / 60, 1);
      speed = lerp(speed, instant, instant > speed ? 0.3 : 0.08);
      press = lerp(press, pressed ? 1 : 0, pressed ? PRESS_IN : PRESS_OUT);
      shell.x = lerp(shell.x, pointer.x, SHELL_FOLLOW);
      shell.y = lerp(shell.y, pointer.y, SHELL_FOLLOW);
      dotShown.x = lerp(dotShown.x, pointer.x, DOT_FOLLOW);
      dotShown.y = lerp(dotShown.y, pointer.y, DOT_FOLLOW);
      // Lerp is exponential decay and never fully converges — snap the shell
      // onto the pointer once close enough so a still cursor rests exactly on it.
      if (Math.abs(shell.x - pointer.x) < SETTLE_EPS && Math.abs(shell.y - pointer.y) < SETTLE_EPS) {
        shell.x = pointer.x;
        shell.y = pointer.y;
        speed = 0;
      }
      root.style.transform = `translate(${shell.x}px, ${shell.y}px)`;

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
      if (target && docBody.contains(target)) {
        // rectCache is refreshed on target change, resize and scroll — never
        // read here per frame, which would force a synchronous layout.
        const rect = rectCache ?? target.getBoundingClientRect();
        rectCache = rect;
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        centerInRoot = { x: center.x - shell.x, y: center.y - shell.y };
        const drift = {
          x: (pointer.x - center.x) * PARALLAX_STRENGTH,
          y: (pointer.y - center.y) * PARALLAX_STRENGTH,
        };
        const absolute = bracketCorners(
          { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
          LOCK_PAD,
        );
        desired = {
          tl: { x: absolute.tl.x - shell.x + drift.x, y: absolute.tl.y - shell.y + drift.y },
          tr: { x: absolute.tr.x - shell.x + drift.x, y: absolute.tr.y - shell.y + drift.y },
          bl: { x: absolute.bl.x - shell.x + drift.x, y: absolute.bl.y - shell.y + drift.y },
          br: { x: absolute.br.x - shell.x + drift.x, y: absolute.br.y - shell.y + drift.y },
        };
      } else {
        if (target) setTarget(null);
        const gap = IDLE_GAP * (1 + speed * SPEED_SPREAD);
        desired = bracketCorners({ x: 0, y: 0, width: 0, height: 0 }, gap);
      }

      // Press feedback: idle reticles pull their corners toward center; locked
      // targets react too (more gently) so a click on a hovered element still
      // reads as a press instead of freezing the frame.
      const pull = press * PRESS_PULL * (target ? LOCKED_PULL : 1);
      // Once off a locked target the corners retract faster (and settle) so a
      // sudden stop never freezes them mid-frame looking like a skewed box.
      const cornerFollow = target ? CORNER_FOLLOW : IDLE_CORNER_FOLLOW;
      CORNER_KEYS.forEach((key, index) => {
        corners[key].x = lerp(corners[key].x, desired[key].x, cornerFollow);
        corners[key].y = lerp(corners[key].y, desired[key].y, cornerFollow);
        // Settle once close enough so corners snap back onto a symmetric frame
        // (e.g. after leaving a locked target) instead of freezing mid-lerp.
        // Never during a press — settling would snap the corners to their rest
        // position and kill the press-gather animation.
        if (pull === 0 && Math.abs(corners[key].x - desired[key].x) < SETTLE_EPS && Math.abs(corners[key].y - desired[key].y) < SETTLE_EPS) {
          corners[key].x = desired[key].x;
          corners[key].y = desired[key].y;
        }
        const px = lerp(corners[key].x, centerInRoot.x, pull);
        const py = lerp(corners[key].y, centerInRoot.y, pull);
        arms[index].style.transform = `translate(${px + ARM_OFFSETS[index].x}px, ${py + ARM_OFFSETS[index].y}px)`;
      });
      const dotHidden = Boolean(target);
      if (dotHidden !== lastDotHidden) {
        dot.style.opacity = dotHidden ? "0" : "1";
        lastDotHidden = dotHidden;
      }
      // The dot leads the shell by a capped, small offset, then settles back to
      // center once it catches up — a lively lead without a visible snap-back.
      const offX0 = dotShown.x - shell.x;
      const offY0 = dotShown.y - shell.y;
      const lead = Math.hypot(offX0, offY0);
      const offX = lead > MAX_DOT_LEAD ? (offX0 / lead) * MAX_DOT_LEAD : offX0;
      const offY = lead > MAX_DOT_LEAD ? (offY0 / lead) * MAX_DOT_LEAD : offY0;
      const dotX = Math.abs(offX) < SETTLE_EPS ? 0 : offX;
      const dotY = Math.abs(offY) < SETTLE_EPS ? 0 : offY;
      dot.style.transform = `translate(calc(-50% + ${dotX}px), calc(-50% + ${dotY}px)) scale(${1 + press * 0.6})`;

      // With no locked target and a still pointer the reticle is frozen — drop
      // the loop until some input wakes it. This is the main CPU win on idle
      // pages: zero frames instead of 60/s. (Corner breathing is a GPU CSS
      // animation, so the reticle stays alive without the loop.)
      if (!target && performance.now() - lastMove > IDLE_MS) {
        // Fallback settle: anchor the reticle exactly on the pointer (shell at
        // the pointer, dot centered) and snap corners onto the idle frame.
        shell.x = pointer.x;
        shell.y = pointer.y;
        dotShown.x = pointer.x;
        dotShown.y = pointer.y;
        root.style.transform = `translate(${pointer.x}px, ${pointer.y}px)`;
        dot.style.transform = `translate(calc(-50% + 0px), calc(-50% + 0px)) scale(${1 + press * 0.6})`;
        CORNER_KEYS.forEach((key, index) => {
          corners[key].x = desired[key].x;
          corners[key].y = desired[key].y;
          // Keep the press-gather while the mouse is held — snapping to the rest
          // frame here would un-collapse the corners during a held press.
          const px = lerp(corners[key].x, centerInRoot.x, pull);
          const py = lerp(corners[key].y, centerInRoot.y, pull);
          arms[index].style.transform = `translate(${px + ARM_OFFSETS[index].x}px, ${py + ARM_OFFSETS[index].y}px)`;
        });
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

  const armClass =
    "pointer-events-none absolute left-0 top-0 size-0 will-change-transform";
  const cornerClass = "tc-corner absolute left-0 top-0 size-3 border-current";
  return (
    <div ref={rootRef} aria-hidden="true" data-testid="target-cursor" data-state="idle" className="pointer-events-none fixed left-0 top-0 z-[9999] size-0 mix-blend-difference text-white will-change-transform">
      <div ref={dotRef} className="pointer-events-none absolute left-0 top-0 size-1 rounded-full bg-current will-change-transform" />
      <div ref={tlRef} className={armClass}>
        <div className={`${cornerClass} tc-corner-tl border-l-[3px] border-t-[3px]`} />
      </div>
      <div ref={trRef} className={armClass}>
        <div className={`${cornerClass} tc-corner-tr border-r-[3px] border-t-[3px]`} />
      </div>
      <div ref={blRef} className={armClass}>
        <div className={`${cornerClass} tc-corner-bl border-b-[3px] border-l-[3px]`} />
      </div>
      <div ref={brRef} className={armClass}>
        <div className={`${cornerClass} tc-corner-br border-b-[3px] border-r-[3px]`} />
      </div>
    </div>
  );
}
