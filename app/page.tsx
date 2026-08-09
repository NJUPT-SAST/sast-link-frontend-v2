"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getSession } from "@/lib/token";
import { Button } from "@/components/ui/button";

// Session is a client-only value; the empty subscribe means we read it once on
// mount so SSR and the first client render agree, then the real value takes over.
const subscribeSession = () => () => {};

/** `/` — the product's entry: a slow-moving starfield (rendered globally in
 *  Providers) with the SAST Link title tilting subtly toward the cursor, and a
 *  login / register pair. Signed-in visitors are bounced straight to /home. */
export default function Home() {
  const router = useRouter();
  const hasSession = useSyncExternalStore(
    subscribeSession,
    () => getSession() !== null,
    () => false,
  );
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (hasSession) router.replace("/home");
  }, [hasSession, router]);

  // Restrained parallax: the title tilts a few degrees toward the cursor.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const frame = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      el.style.transform = `perspective(600px) rotateX(${current.y * -3}deg) rotateY(${current.x * 3}deg)`;
      raf = requestAnimationFrame(frame);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  if (hasSession) return null;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1
        ref={titleRef}
        data-cursor-target
        className="type-title1 text-5xl font-bold tracking-tight transition-[transform] will-change-transform sm:text-7xl"
      >
        SAST Link
      </h1>
      <div className="mt-6 flex max-w-md flex-col items-center gap-2">
        <p className="type-tech text-xs text-tertiary">WHAT IS SAST LINK ?</p>
        <p className="type-tech text-xs text-tertiary/70">
          SAST&apos;s OAuth &amp; profile provider.
        </p>
      </div>
      <div className="mt-10 flex items-center gap-4">
        <Button asChild variant="outline" size="lg">
          <Link href="/register">注册</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/login">登录</Link>
        </Button>
      </div>
    </main>
  );
}
