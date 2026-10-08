"use client";

import { useEffect, useState, type ComponentType } from "react";

/** The dev-only gate for the H5 diagnostic probe (the probe itself lives in
 *  ./h5-probe and is pulled in via dynamic import).
 *
 * The probe loads third-party CDN scripts and fires a live requestAccess with
 * the production app id — exactly what should never run for end users. The
 * runtime flag arrives as a prop from the server page, so in production the
 * gate never fetches the probe chunk at runtime; the bundler still emits it
 * (the chunk graph precedes dead-code elimination), which is why
 * scripts/strip-dev-probe.mjs removes the orphan after `next build`. */
export default function H5ProbeClient({ dev }: { dev: boolean }) {
  const [Probe, setProbe] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!dev) return;
    let cancelled = false;
    import("./h5-probe").then((module) => {
      if (!cancelled) setProbe(() => module.H5Probe);
    });
    return () => {
      cancelled = true;
    };
  }, [dev]);

  if (!Probe) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <p className="text-sm text-tertiary">
          {dev ? "正在加载诊断探针…" : "诊断探针仅在开发环境可用（pnpm dev）。"}
        </p>
      </main>
    );
  }

  return <Probe />;
}
