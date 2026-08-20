"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/animation/page-transition";
import { PhotoGlyphsSection } from "@/components/visual/photo-glyphs-section";

/** `/` — the product's entry: a slow-moving starfield (rendered globally in
 *  Providers) with the SAST Link title tilting subtly toward the cursor, and a
 *  login / register pair. Signed-in visitors are bounced straight to /home.
 *
 *  The first frame renders nothing. SSR has no session, so rendering the
 *  landing page immediately would flash login/register at a signed-in user
 *  before the redirect lands. The global boot intro (SurveyIntro) covers the
 *  empty frame, so the landing page only ever appears for signed-out visitors,
 *  once the session check resolves. */
export default function Home() {
  const router = useRouter();
  const status = useAuthSession();
  const [showLanding, setShowLanding] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    } else if (status === "unauthenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowLanding(true);
    }
  }, [router, status]);

  // Restrained parallax: the title tilts a few degrees toward the cursor.
  // Runs once the landing is actually shown.
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
  }, [showLanding]);

  // Until the session check resolves, cover the frame with black — the boot
  // intro paints over the same color, so signed-out and signed-in visitors both
  // see an unbroken dark opening instead of a white flash.
  if (!showLanding) return <div aria-hidden="true" className="fixed inset-0 bg-black" />;

  // Fade, not the default slide: this page's transition container is the
  // full-viewport landing itself, and slide's translate on a min-h-screen
  // element pushes it past the viewport edge mid-animation, flashing a
  // scrollbar that only disappears once the transform settles. Fade has no
  // transform, so no scrollbar.
  return (
    <>
      <PageTransition
        variant="fade"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
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
      </PageTransition>
      {/* Second screen: full-viewport monochrome character-photo background. */}
      <PhotoGlyphsSection />
    </>
  );
}
