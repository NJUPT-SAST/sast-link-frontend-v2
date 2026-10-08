import type { Metadata } from "next";
import { Suspense } from "react";

import CallbackClient from "./callback-client";

/** The login_code rides in the URL query, so this page must never act as a
 *  Referer for outbound requests. The metadata API resolves at prerender time
 *  and lands in the exported HTML's head — an inline <meta> in the JSX would
 *  only appear after hydration (static export suspends the whole tree on
 *  useSearchParams), and the host's site-wide strict-origin-when-cross-origin
 *  already limits cross-origin leaks to the origin. */
export const metadata: Metadata = { referrer: "no-referrer" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CallbackClient />
    </Suspense>
  );
}
