"use client";

import { useEffect, useState } from "react";

import * as publicConfig from "@/lib/config/public";

/**
 * One-off diagnostic page for the Feishu in-client login-free entrance
 * (POST /oauth/lark/app-code, backend PR #105).
 *
 * Round 1 established: the SDK script loads, the factory starts
 * (__JSSDK_VERSION__ appears), then dies mid-run leaving h5sdk/tt/lark
 * unmounted, with the exception masked as a bare "Script error." (cross-origin
 * script). The CDN answers `Access-Control-Allow-Origin: *`, so this round
 * loads each candidate version with `crossorigin="anonymous"` — unmasking
 * file/line/column — and additionally probes several SDK versions: if one of
 * them mounts cleanly in the real container, switching versions is the fix.
 *
 * The page stays inert: no requestAccess call, no backend request. Open it
 * inside the Feishu web-app container (temporary 网页应用 home URL) and read
 * the report.
 */

interface VersionReport {
  version: string;
  status: "loading" | "done" | "failed";
  mounted: boolean;
  error: string | null;
  errorAt: string | null;
  ver?: string;
}

interface RequestAccessReport {
  phase: string;
  result: string;
}

const VERSIONS = ["1.5.32", "1.5.40", "1.5.29"];
const BASE_URL = "https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk";

export default function H5ProbePage() {
  const [reports, setReports] = useState<VersionReport[]>([]);
  const [requestAccessReport, setRequestAccessReport] = useState<RequestAccessReport | null>(null);
  const [envLine, setEnvLine] = useState<string>("");

  useEffect(() => {
    // One synchronous read of a stable environment — the page is inert.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnvLine(`${window.navigator.userAgent} | define=${typeof (window as { define?: unknown }).define}`);

    let cancelled = false;
    const update = (patch: VersionReport) => {
      if (cancelled) return;
      setReports((list) => {
        const i = list.findIndex((r) => r.version === patch.version);
        if (i === -1) return [...list, patch];
        const next = [...list];
        next[i] = patch;
        return next;
      });
    };

    (async () => {
      for (const version of VERSIONS) {
        // Reset what the previous round's factory may or may not have set.
        // The container-injected ttJSBridge is left untouched — it is not ours.
        const w = window as unknown as Record<string, unknown>;
        delete w.__JSSDK_VERSION__;
        delete w.h5sdk;
        delete w.lark;
        delete w.tt;

        const report: VersionReport = {
          version,
          status: "loading",
          mounted: false,
          error: null,
          errorAt: null,
        };

        await new Promise<void>((resolve) => {
          const onError = (event: ErrorEvent) => {
            if (event.filename.includes(`h5-js-sdk-${version}`)) {
              report.error = event.message;
              report.errorAt = `${event.filename.replace(/^.*\//, "")}:${event.lineno}:${event.colno}`;
              window.removeEventListener("error", onError);
            }
          };
          window.addEventListener("error", onError);

          const script = document.createElement("script");
          script.src = `${BASE_URL}-${version}.js`;
          // The CDN sends Access-Control-Allow-Origin: *, so crossorigin
          // un-masks the otherwise opaque "Script error." with file/line/col.
          script.crossOrigin = "anonymous";
          script.async = true;
          script.onload = () => {
            report.ver = typeof w.__JSSDK_VERSION__ === "object" ? "yes" : "no";
            report.mounted = typeof w.h5sdk !== "undefined";
            report.status = "done";
            window.removeEventListener("error", onError);
            script.remove();
            resolve();
          };
          script.onerror = () => {
            report.status = "failed";
            report.error = "network/CSP load failure";
            window.removeEventListener("error", onError);
            script.remove();
            resolve();
          };
          document.head.appendChild(script);
        });

        update(report);
      }

      // Live requestAccess call with the production app id — the version sweep
      // above proves mounting; this proves the JSAPI actually answers. Reports
      // the raw success/fail payload (errno and all) so a refused grant is
      // distinguishable from an app-id or permission problem. Runs after the
      // sweep on the already-mounted 1.5.32 instance.
      const appId = publicConfig.FEISHU_CLIENT_ID;
      const requestAccess = (
        window as unknown as { tt?: { requestAccess?: (o: Record<string, unknown>) => void } }
      ).tt?.requestAccess;
      if (!appId) {
        setRequestAccessReport({ phase: "requestAccess", result: "FEISHU_CLIENT_ID 未配置" });
      } else if (!requestAccess) {
        setRequestAccessReport({ phase: "requestAccess", result: "tt.requestAccess 不可用（非飞书容器？）" });
      } else {
        await new Promise<void>((resolve) => {
          const timer = window.setTimeout(
            () => {
              setRequestAccessReport({ phase: "requestAccess", result: "超时（15s 无回调）" });
              resolve();
            },
            15_000,
          );
          requestAccess({
            appID: appId,
            scopeList: [],
            success: (res: { code?: string }) => {
              window.clearTimeout(timer);
              setRequestAccessReport({
                phase: "requestAccess",
                result: `success：${res.code ? `拿到预授权码（${res.code.slice(0, 8)}…）` : "但未携带 code"}`,
              });
              resolve();
            },
            fail: (err: unknown) => {
              window.clearTimeout(timer);
              setRequestAccessReport({
                phase: "requestAccess",
                result: `fail：${JSON.stringify(err)}`,
              });
              resolve();
            },
          });
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black p-6 text-left font-mono text-[13px] leading-5 text-white">
      <h1 className="mb-4 text-base font-bold">H5 login probe v3</h1>
      <section className="mb-6">
        <h2 className="mb-2 font-bold text-link">environment</h2>
        <pre className="whitespace-pre-wrap break-all rounded border border-hairline bg-card p-3 text-foreground">
          {envLine || "…"}
        </pre>
      </section>
      {reports.map((r) => (
        <section key={r.version} className="mb-6">
          <h2 className="mb-2 font-bold text-link">h5-js-sdk-{r.version}.js</h2>
          <pre className="whitespace-pre-wrap break-all rounded border border-hairline bg-card p-3 text-foreground">
            {JSON.stringify(
              {
                status: r.status,
                factory_started: r.ver ?? null,
                h5sdk_mounted: r.mounted,
                error: r.error,
                at: r.errorAt,
              },
              null,
              2,
            )}
          </pre>
        </section>
      ))}
      <section className="mb-6">
        <h2 className="mb-2 font-bold text-link">requestAccess（生产 appID 实调）</h2>
        <pre className="whitespace-pre-wrap break-all rounded border border-hairline bg-card p-3 text-foreground">
          {requestAccessReport ? JSON.stringify(requestAccessReport, null, 2) : "…"}
        </pre>
      </section>
    </div>
  );
}
