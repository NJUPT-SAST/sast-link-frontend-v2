"use client";

import { useEffect, useMemo, useState } from "react";

import { useHideCursor } from "@/hooks/use-hide-cursor";
import { generateStars, type Star } from "@/lib/visual/starfield";

const SEEN_KEY = "sast-survey-seen";
const INTRO_SEED = 179;
const STAR_COUNT = 24;
const OUT_MS = 2600; // fade-out starts
const DONE_MS = 2900; // unmount

type Phase = "hidden" | "play" | "out" | "done";

const CORNERS = [
  { pos: "left-6 top-6", h: "left-0 top-0 origin-left", v: "left-0 top-0 origin-top" },
  { pos: "right-6 top-6", h: "right-0 top-0 origin-right", v: "right-0 top-0 origin-top" },
  { pos: "bottom-6 left-6", h: "bottom-0 left-0 origin-left", v: "bottom-0 left-0 origin-bottom" },
  { pos: "bottom-6 right-6", h: "bottom-0 right-0 origin-right", v: "bottom-0 right-0 origin-bottom" },
];

/** Opening sequence: survey marks draw themselves, stars settle one by one,
 *  crosshair locks, then the layer fades to reveal the live starfield (which
 *  mounts underneath independently — no fake transition). Once per session,
 *  skippable, never under reduced-motion. Always dark: it is a boot survey. */
export function SurveyIntro() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const stars = useMemo<Star[]>(
    () => generateStars(INTRO_SEED, 1440, 900).slice(0, STAR_COUNT),
    [],
  );
  const playing = phase !== "hidden" && phase !== "done";
  useHideCursor(playing);

  // Play once per session as the app's opening sequence, on whatever route the
  // visitor lands first — signed-in users land on /home, not `/`, and should
  // see it too. Skippable, never under reduced-motion.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sessionStorage.getItem(SEEN_KEY)) return setPhase("done");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPhase("done");

    setPhase("play");
    const timers = [
      setTimeout(() => setPhase("out"), OUT_MS),
      setTimeout(() => {
        setPhase("done");
        sessionStorage.setItem(SEEN_KEY, "1");
      }, DONE_MS),
    ];
    const skip = () => {
      timers.forEach(clearTimeout);
      setPhase("done");
      sessionStorage.setItem(SEEN_KEY, "1");
    };
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  if (phase === "hidden" || phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      data-testid="survey-intro"
      className="fixed inset-0 z-[100] bg-black font-mono text-white"
      style={phase === "out" ? { animation: "survey-out 0.3s linear both" } : undefined}
    >
      {CORNERS.map((c) => (
        <div key={c.pos} className={`absolute size-4 ${c.pos}`}>
          <span
            className={`absolute h-0.5 w-4 bg-white ${c.h}`}
            style={{ animation: "survey-mark-x 0.3s 0.1s cubic-bezier(.2,.7,.3,1) both" }}
          />
          <span
            className={`absolute h-4 w-0.5 bg-white ${c.v}`}
            style={{ animation: "survey-mark-y 0.3s 0.25s cubic-bezier(.2,.7,.3,1) both" }}
          />
        </div>
      ))}

      <div
        className="tick-ruler absolute inset-x-6 top-6 h-1.5"
        style={{ animation: "survey-fade 0.3s 0.5s linear both" }}
      />
      <div
        className="absolute left-6 top-10 text-[10px] tracking-[0.2em]"
        style={{ animation: "survey-fade 0.3s 0.7s linear both" }}
      >
        32.06° N — 118.79° E
      </div>

      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute bg-white"
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            width: s.size,
            height: s.size,
            animation: `survey-star 0.4s ${0.9 + i * 0.05}s cubic-bezier(.2,.7,.3,1) both`,
          }}
        />
      ))}

      <div
        className="absolute left-1/2 top-1/2"
        style={{ animation: "survey-fade 0.3s 2.15s linear both" }}
      >
        <span className="absolute h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 bg-white" />
        <span className="absolute h-8 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white" />
        <span className="absolute top-5 -translate-x-1/2 text-[9px] tracking-[0.25em]">LOCKED</span>
      </div>
    </div>
  );
}
