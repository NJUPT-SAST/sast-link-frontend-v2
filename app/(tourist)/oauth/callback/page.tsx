import { Suspense } from "react";

import CallbackClient from "./callback-client";

/** Server page. The referrer policy must be in the prerendered HTML (the
 *  login_code rides in the URL query and the page must never leak it as a
 *  Referer), so it is rendered here — a server pass React hoists into the
 *  head — instead of inside the client tree, which static export prerenders
 *  as a suspending shell. */
export default function Page() {
  return (
    <>
      <meta name="referrer" content="no-referrer" />
      <Suspense fallback={null}>
        <CallbackClient />
      </Suspense>
    </>
  );
}
