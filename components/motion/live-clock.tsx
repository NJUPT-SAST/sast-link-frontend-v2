"use client";

import { memo, useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Ticking mono clock. Renders nothing until mounted (no hydration drift).
 *  Memoized so its per-second setState never re-renders the parent. */
export const LiveClock = memo(function LiveClock({
  className,
  prefix = "· ",
}: {
  className?: string;
  prefix?: string;
}) {
  const [now, setNow] = useState("");

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNow(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;
  return <span className={className}>{prefix}{now}</span>;
});
