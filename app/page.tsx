"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useAuthSession } from "@/hooks/use-auth-session";
import { useLarkH5AutoLogin } from "@/hooks/use-lark-h5-auto-login";
import { DEV_RUNTIME } from "@/lib/config/public";
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
  // Inside the Feishu client the landing tries the app-code login first; while
  // it runs the splash cover stays up (no flash of login/register at a user
  // the auto-login is about to sign in).
  const larkLogin = useLarkH5AutoLogin(status);
  const [showLanding, setShowLanding] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    } else if (
      status === "unauthenticated" &&
      larkLogin.status !== "running"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowLanding(true);
    }
  }, [router, status, larkLogin.status]);

  // Restrained parallax: the title tilts a few degrees toward the cursor.
  // Runs once the landing is actually shown. Coarse-pointer devices never
  // fire pointermove for it, so the loop would spin at 60fps writing a
  // transform nothing drives — gate it off entirely (same condition the
  // custom cursor uses).
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

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
  if (!showLanding) {
    if (larkLogin.status === "running") {
      return (
        <div
          className="fixed inset-0 grid place-items-center bg-black"
          data-testid="lark-login-cover"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-link" />
            <p className="type-tech text-tertiary">正在通过飞书登录…</p>
          </div>
        </div>
      );
    }
    return <div aria-hidden="true" className="fixed inset-0 bg-black" />;
  }

  // Fade, not the default slide: this page's transition container is the
  // full-viewport landing itself, and slide's translate on a min-h-dvh
  // element pushes it past the viewport edge mid-animation, flashing a
  // scrollbar that only disappears once the transform settles. Fade has no
  // transform, so no scrollbar.
  return (
    <>
      <PageTransition
        variant="fade"
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center"
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
        {larkLogin.status === "failed" && (
          <div className="mt-6 flex max-w-md flex-col items-center gap-2 text-center">
            <p className="text-[13px] text-destructive" data-testid="lark-login-error">
              飞书登录失败：{larkLogin.error}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={larkLogin.retry}>
                重试飞书登录
              </Button>
              {/* The in-client failure path has no address bar to type a URL
                  into, so the diagnostic page rides along here — one tap away
                  without re-pointing the Feishu web-app home URL. Dev builds
                  only: the probe loads third-party CDN scripts and calls
                  requestAccess with the production app id, so it never ships
                  in a production bundle. */}
              {DEV_RUNTIME && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/debug/h5">查看诊断探针</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </PageTransition>
      {/* Second screen: full-viewport monochrome character-photo background. */}
      <PhotoGlyphsSection />
    </>
  );
}
