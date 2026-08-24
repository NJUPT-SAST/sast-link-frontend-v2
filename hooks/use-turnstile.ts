"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TURNSTILE_SITE_KEY } from "@/lib/config/public";

/** Turnstile availability.
 *
 *  - `disabled`  — no site key configured. The channel is off for this deployment.
 *  - `loading`   — script in flight.
 *  - `ready`     — widget rendered and usable.
 *  - `unavailable` — script failed to load, or the widget reported an error.
 *
 *  `disabled` and `unavailable` are both terminal and both mean "hide the entry
 *  point": the backend verifies the token unconditionally and has no skip path,
 *  so a form we cannot attach a token to would only produce a guaranteed refusal.
 */
export type TurnstileState = "disabled" | "loading" | "ready" | "unavailable";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "cf-turnstile-script";
/** A script that neither loads nor errors (blocked by a network filter that
 *  swallows the request) would leave the form stuck on a spinner forever, so a
 *  ceiling turns that silence into an explicit `unavailable`. */
const LOAD_TIMEOUT_MS = 10_000;

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      theme?: "auto" | "light" | "dark";
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Loads the Turnstile script once per document and reports availability.
 *
 *  The script tag is reused across mounts rather than re-injected: Turnstile
 *  installs a single global, and a second tag would race the first.
 */
export function useTurnstileScript(): TurnstileState {
  // Resolve the already-loaded case during initialization rather than in an
  // effect: a second mount (navigating back to the form) finds the global in
  // place, and a synchronous setState in the effect body would be a cascading
  // render for a value that was knowable up front.
  const [state, setState] = useState<TurnstileState>(() => {
    if (!TURNSTILE_SITE_KEY) return "disabled";
    if (typeof window !== "undefined" && window.turnstile) return "ready";
    return "loading";
  });

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    // Already resolved by the initializer, or resolved by a previous run.
    if (window.turnstile) return;

    let settled = false;
    const finish = (next: TurnstileState) => {
      if (settled) return;
      settled = true;
      setState(next);
    };

    const timer = setTimeout(() => finish("unavailable"), LOAD_TIMEOUT_MS);
    const onLoad = () => finish(window.turnstile ? "ready" : "unavailable");
    const onError = () => finish("unavailable");

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      clearTimeout(timer);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, []);

  return state;
}

interface UseTurnstileWidgetOptions {
  /** Only rendered once the script is ready; other states render nothing. */
  state: TurnstileState;
  onUnavailable: () => void;
}

/** Renders the widget into a ref'd container and tracks the current token.
 *
 *  The token is single-use and expires, so `reset` is exposed for the caller to
 *  invoke after a failed submit — reusing a spent token would fail verification
 *  with an error that looks like a form problem.
 */
export function useTurnstileWidget({ state, onUnavailable }: UseTurnstileWidgetOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");
  // Kept in a ref so the render effect does not re-run (and re-render the
  // widget) every time the parent supplies a new callback identity.
  const onUnavailableRef = useRef(onUnavailable);
  useEffect(() => {
    onUnavailableRef.current = onUnavailable;
  }, [onUnavailable]);

  useEffect(() => {
    if (state !== "ready") return;
    const api = window.turnstile;
    const container = containerRef.current;
    if (!api || !container || widgetIdRef.current) return;

    try {
      widgetIdRef.current = api.render(container, {
        sitekey: TURNSTILE_SITE_KEY as string,
        callback: (next) => setToken(next),
        // An expired token is not a failure — clearing it disables submit until
        // the widget issues a fresh one.
        "expired-callback": () => setToken(""),
        "error-callback": () => {
          setToken("");
          onUnavailableRef.current();
        },
        theme: "auto",
      });
    } catch {
      onUnavailableRef.current();
    }

    return () => {
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      if (id) {
        try {
          api.remove(id);
        } catch {
          // Removal races a script teardown on fast unmount; the container is
          // going away regardless, so there is nothing to recover.
        }
      }
    };
  }, [state]);

  const reset = useCallback(() => {
    setToken("");
    const id = widgetIdRef.current;
    if (id && window.turnstile) {
      try {
        window.turnstile.reset(id);
      } catch {
        // Same rationale as remove() above.
      }
    }
  }, []);

  return { containerRef, token, reset };
}
