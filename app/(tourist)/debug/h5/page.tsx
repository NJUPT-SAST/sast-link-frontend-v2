"use client";

import { useEffect, useState } from "react";

/**
 * One-off diagnostic page for the Feishu in-client login-free entrance
 * (POST /oauth/lark/app-code, backend PR #105). It replays the exact SDK
 * loading sequence the landing page performs and reports every fact needed to
 * tell the failure classes apart:
 *
 * - the webview UA / platform (Feishu token? lark version? WebApp marker?)
 * - whether an AMD loader (window.define) hijacked the SDK's UMD prologue —
 *   the factory registers as a module and never runs, so window.h5sdk stays
 *   undefined while the script itself loads fine
 * - whether the SDK factory mounted h5sdk / tt / lark once executed
 * - any exception the SDK throws while executing
 *
 * The page is intentionally inert: it never calls requestAccess and never
 * touches the backend. Open it inside the Feishu web-app container (set it as
 * the 网页应用 home URL in the Feishu admin console) and read the report.
 */

type Fact = Record<string, string | boolean | null>;

const SDK_URL =
  "https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk-1.5.32.js";

export default function H5ProbePage() {
  const [env, setEnv] = useState<Fact | null>(null);
  const [sdk, setSdk] = useState<Fact | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const facts: Fact = {
      userAgent: window.navigator.userAgent,
      platform: window.navigator.platform,
      "typeof define": typeof (window as { define?: unknown }).define,
      "define.amd": Boolean(
        (window as { define?: { amd?: unknown } }).define?.amd,
      ),
      "cookieEnabled": window.navigator.cookieEnabled,
    };
    // The probe is inert beyond this single read of a stable environment —
    // one synchronous settle is the whole point of the page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnv(facts);

    const onError = (event: ErrorEvent) => {
      setErrors((list) => [...list, `error: ${event.message}`]);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      setErrors((list) => [...list, `unhandledrejection: ${event.reason}`]);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    const report = (phase: string) => {
      const w = window as unknown as Record<string, unknown>;
      setSdk({
        phase,
        "typeof __JSSDK_VERSION__": typeof w.__JSSDK_VERSION__,
        "typeof h5sdk": typeof w.h5sdk,
        "typeof h5sdk.ready": typeof (w.h5sdk as { ready?: unknown })?.ready,
        "typeof tt": typeof w.tt,
        "typeof tt.requestAccess": typeof (w.tt as { requestAccess?: unknown })
          ?.requestAccess,
        "typeof tt.requestAuthCode": typeof (w.tt as { requestAuthCode?: unknown })
          ?.requestAuthCode,
        "typeof lark": typeof w.lark,
        "ttJSBridge === null": w.ttJSBridge === null,
      });
    };
    script.onload = () => {
      report("script.onload (sync)");
      // Give async settling (bridge handshake) a beat before the final read.
      window.setTimeout(() => report("onload + 1500ms"), 1500);
    };
    script.onerror = () => {
      setSdk({ phase: "script.onerror", "typeof h5sdk": "n/a" });
    };
    document.head.appendChild(script);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black p-6 text-left font-mono text-[13px] leading-5 text-white">
      <h1 className="mb-4 text-base font-bold">H5 login probe</h1>
      <Section title="environment" fact={env} />
      <Section title="sdk" fact={sdk} />
      <Section
        title="errors"
        fact={
          errors.length
            ? Object.fromEntries(errors.map((e, i) => [String(i), e]))
            : { none: true }
        }
      />
    </div>
  );
}

function Section({ title, fact }: { title: string; fact: Fact | null }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-bold text-link">{title}</h2>
      <pre className="whitespace-pre-wrap break-all rounded border border-hairline bg-card p-3 text-foreground">
        {fact ? JSON.stringify(fact, null, 2) : "…"}
      </pre>
    </section>
  );
}
