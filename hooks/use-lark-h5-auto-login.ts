"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import * as publicConfig from "@/lib/config/public";
import { toApiError } from "@/lib/api/errors";
import { larkAppCodeLogin } from "@/lib/api/oauth";
import { isLarkUserAgent, loadLarkH5Sdk, requestLarkAppCode, waitLarkH5Ready } from "@/lib/lark-h5";
import { establishLoginCodeSession } from "@/lib/login-session";
import type { AuthSessionStatus } from "@/hooks/use-auth-session";

export type LarkH5AutoLoginStatus = "off" | "running" | "failed";

export interface LarkH5AutoLogin {
  status: LarkH5AutoLoginStatus;
  /** Human-readable failure message once status is "failed". */
  error: string | null;
  retry: () => void;
}

/** How long the <script> load may take before the flow gives up. */
const SDK_LOAD_TIMEOUT_MS = 8_000;
/** How long the h5sdk bridge handshake may take. */
const SDK_READY_TIMEOUT_MS = 5_000;

function raceTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

/**
 * Feishu in-client login-free entrance (backend PR #105).
 *
 * Runs only when three things hold: this tab resolved as signed-out, the UA
 * says the page sits inside the Feishu client, and the deployment configured
 * the Feishu app id (absent → the feature is off and the landing page behaves
 * as in a normal browser). The flow: load the JSSDK → request the JSAPI
 * pre-authorization code → POST /oauth/lark/app-code →
 *
 * - bound → redeem login_code via the shared session leg, land the user;
 * - unbound → forward to /register carrying the double-binding pair and the
 *   display hints, exactly like the authorize-page callback's redirect.
 *
 * Failure ends the attempt but stays recoverable: the caller keeps the landing
 * page reachable and offers retry plus the ordinary login entrance.
 */
export function useLarkH5AutoLogin(sessionStatus: AuthSessionStatus): LarkH5AutoLogin {
  const router = useRouter();
  const [status, setStatus] = useState<LarkH5AutoLoginStatus>("off");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // A non-Lark UA (or missing config) is decided once; retries never re-check.
  const eligibilityRef = useRef<boolean | null>(null);
  // StrictMode double-invokes effects; the flow must run once per attempt.
  const attemptRef = useRef(-1);

  const retry = useCallback(() => {
    if (status === "failed") setAttempt((n) => n + 1);
  }, [status]);

  useEffect(() => {
    if (sessionStatus !== "unauthenticated") return;

    if (eligibilityRef.current === null) {
      eligibilityRef.current =
        typeof window !== "undefined" &&
        isLarkUserAgent(window.navigator.userAgent) &&
        Boolean(publicConfig.FEISHU_CLIENT_ID);
    }
    if (!eligibilityRef.current) return;
    // A retry bumps `attempt`; the same attempt must not run twice.
    if (attemptRef.current === attempt) return;
    attemptRef.current = attempt;

    setStatus("running");
    setError(null);

    // The chain runs to completion once started: `router` is a global handle
    // and abandoning a login mid-flight because a re-render recycled the
    // effect would strand the user on the cover. State writes after unmount
    // are no-ops in React 18, so no mounted-guard is needed.
    (async () => {
      await raceTimeout(loadLarkH5Sdk(), SDK_LOAD_TIMEOUT_MS, "无法加载飞书 JSSDK");
      await waitLarkH5Ready(SDK_READY_TIMEOUT_MS);
      const preAuthCode = await requestLarkAppCode(publicConfig.FEISHU_CLIENT_ID as string);
      const data = (await larkAppCodeLogin(preAuthCode)).data.data;
      if (data.bound && data.login_code) {
        const destination = await establishLoginCodeSession(data.login_code);
        router.replace(destination);
        return;
      }
      if (!data.bound && data.registration_state && data.oauth_state) {
        const params = new URLSearchParams({
          registration_state: data.registration_state,
          oauth_state: data.oauth_state,
        });
        if (data.name) params.set("name", data.name);
        if (data.avatar) params.set("avatar", data.avatar);
        router.replace(`/register?${params.toString()}`);
        return;
      }
      throw new Error("登录响应不完整");
    })().catch((reason) => {
      setStatus("failed");
      setError(toApiError(reason).message);
    });
  }, [attempt, router, sessionStatus]);

  return { status, error, retry };
}
