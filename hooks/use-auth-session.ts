"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import { refreshFromCookie } from "@/lib/api/auth";
import { clearSession, createSession, getSession, setSession } from "@/lib/token";
import { onAuthInvalidated } from "@/lib/auth-cross-tab";
import { isConcurrentRefresh } from "@/lib/api/errors";
import type { TokenData } from "@/lib/api/types";

export type AuthSessionStatus = "loading" | "authenticated" | "unauthenticated";

function isTokenData(value: unknown): value is TokenData {
  if (!value || typeof value !== "object") return false;
  const t = value as Record<string, unknown>;
  // The frontend only needs the access token and its TTL; a refresh token in
  // the response is discarded (the cookie carries it), so it must not be
  // required — the backend may stop echoing it now that nothing stores it.
  return typeof t.access_token === "string" && typeof t.expires_in === "number";
}

function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

/**
 * Resolve whether the current tab has a usable session.
 *
 * The session lives in sessionStorage, which is per-tab — but a browser that
 * logged in elsewhere still carries the backend's httpOnly session cookie. When
 * this tab has no local session, `POST /auth/refresh` with the cookie as the
 * refresh credential (see `lib/api/auth.refreshFromCookie`) both confirms the
 * session and mints a fresh access token the frontend rebuilds from. That is
 * what lets a new tab (and the OAuth authorize→consent flow) recognise an
 * already-signed-in browser instead of bouncing to /login.
 *
 * - `getSession()` present → "authenticated" (synchronous, no network).
 * - probe 200 → `setSession` + "authenticated". The `setState` forces the
 *   re-render that lets SWR keys like `profileKey()` re-resolve against the new
 *   token, so a profile fetch kicks off naturally.
 * - probe 401 → "unauthenticated" (definitive).
 * - probe network/5xx/timeout → one retry, then "unauthenticated" so a page
 *   never spins forever on a dead backend.
 *
 * A `useRef` guard keeps the mount probe single-shot. StrictMode double-invokes
 * effects in dev; two concurrent probes would race the cookie's rotating
 * refresh token (the loser reads a within-grace revoked token and gets 401), so
 * exactly one probe must run. A cross-tab logout re-runs the same resolution —
 * the shared cookie is already gone, so the probe settles on "unauthenticated"
 * and the guard redirects — instead of this tab showing a dead session for the
 * rest of the access token's life.
 */
export function useAuthSession(): AuthSessionStatus {
  const [status, setStatus] = useState<AuthSessionStatus>("loading");
  const probedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  // mountedRef guards against scheduling retries or setState after unmount (a
  // probe whose .catch lands after a navigation); genRef makes only the latest
  // resolution's probe results count, so a stale in-flight probe cannot flash
  // an authenticated state after a cross-tab revocation re-resolved.
  const mountedRef = useRef(false);
  const genRef = useRef(0);

  const clearRetry = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resolve = useCallback(() => {
    // Cancel any in-flight retry from a previous resolution (e.g. a cross-tab
    // revocation arriving while the mount probe's retry is pending), so two
    // probe chains never race. Bump the generation so a probe that was already
    // in flight cannot overwrite this resolution's outcome.
    clearRetry();
    const gen = ++genRef.current;

    // Fast path: this tab already holds a session — nothing to probe. The
    // synchronous setState is fine here (it converges to the state the hook is
    // about to report anyway) and mirrors the landing page's own session check.
    if (getSession()) {
      setStatus("authenticated");
      return;
    }

    let retried = false;
    const probe = () => {
      if (!mountedRef.current || gen !== genRef.current) return;
      refreshFromCookie()
        .then((response) => {
          if (!mountedRef.current || gen !== genRef.current) return;
          const data = response.data.data;
          if (!isTokenData(data)) {
            // A malformed response must not reach the session cache:
            // getSession() returns the cached object unchecked, so a bad token
            // would be truthy forever and strand the user in a dead loop.
            setStatus("unauthenticated");
            return;
          }
          setSession(createSession(data.access_token, data.expires_in));
          setStatus("authenticated");
        })
        .catch((error) => {
          if (!mountedRef.current || gen !== genRef.current) return;
          if (isConcurrentRefresh(error) && !retried) {
            // 40108 = a sibling tab already rotated the cookie's refresh token
            // within the grace window (multi-tab cold-start race). Retry once —
            // the shared cookie jar now carries the winner's token. A plain 401
            // (no cookie, or a definitively dead one) is not this and ends
            // immediately, so a signed-out visitor is not made to wait a beat.
            retried = true;
            timerRef.current = window.setTimeout(probe, 600);
            return;
          }
          if (isUnauthorized(error)) {
            setStatus("unauthenticated");
            return;
          }
          // Transient failure (network / 5xx / timeout): retry once so a blip
          // does not bounce a signed-in visitor to /login, then fall through —
          // a dead backend cannot be told apart from "signed out" and the page
          // must not spin forever.
          if (!retried) {
            retried = true;
            timerRef.current = window.setTimeout(probe, 1500);
            return;
          }
          setStatus("unauthenticated");
        });
    };
    probe();
  }, [clearRetry]);

  useEffect(() => {
    mountedRef.current = true;
    if (probedRef.current) return;
    probedRef.current = true;
    resolve();
  }, [resolve]);

  // Cross-tab revocation (logout / password change in another tab): the shared
  // cookie is already cleared server-side, so drop our local copy and re-resolve
  // — the probe 401s and the guard redirects to login — rather than keep showing
  // a session the backend has revoked.
  useEffect(() => {
    return onAuthInvalidated(() => {
      clearSession();
      setStatus("loading");
      resolve();
    });
  }, [resolve]);

  // Drop any pending retry and mark unmounted when the consumer goes away, so a
  // probe whose .catch lands later does not setState or schedule a retry.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearRetry();
    };
  }, [clearRetry]);

  return status;
}
