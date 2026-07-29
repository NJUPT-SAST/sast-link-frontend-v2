"use client";

import { LiveClock } from "@/components/motion/live-clock";
import { useSystemHealth } from "@/hooks/use-system-health";

const corner = "absolute size-2 border-foreground/40";

const toneClass = {
  ok: "bg-success",
  down: "bg-destructive",
  unknown: "bg-muted-foreground",
} as const;

/** The empty middle of /home, turned exhibit: a centered instrument —
 *  mono readout clock, tick ruler, and live /health signals framed by
 *  survey corner marks. */
export function InstrumentPanel() {
  const readings = useSystemHealth();

  return (
    <section aria-label="系统状态" className="relative border border-hairline px-6 py-10 sm:px-10">
      <span aria-hidden className={`${corner} left-1 top-1 border-l border-t`} />
      <span aria-hidden className={`${corner} right-1 top-1 border-r border-t`} />
      <span aria-hidden className={`${corner} bottom-1 left-1 border-b border-l`} />
      <span aria-hidden className={`${corner} bottom-1 right-1 border-b border-r`} />

      <div className="flex flex-col items-center gap-5">
        <div className="font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
          <LiveClock prefix="" />
        </div>
        <div aria-hidden className="tick-ruler h-2 w-48 text-foreground/30 sm:w-64" />
        <dl className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-xs tracking-[0.15em]">
          {readings.map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <span aria-hidden className={`size-1.5 ${toneClass[r.tone]}`} />
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
