/**
 * Feishu (Lark) in-client H5 layer: environment detection, JSSDK loading, and
 * the JSAPI pre-authorization code request that backs `POST /oauth/lark/app-code`
 * (backend PR #105).
 *
 * The page is opened inside the Feishu client when the web-app capability of
 * the SAST Feishu app points at this frontend. In that environment the JSSDK
 * script injects `window.h5sdk` and `window.tt`; `tt.requestAccess` mints the
 * one-time pre-authorization code (3 min TTL) the backend redeems. Old clients
 * (<6.9.0) answer requestAccess with errno 103 — fall back to
 * tt.requestAuthCode, which yields the same code family. Ordinary browsers
 * never load the script and keep the authorize-page flow.
 */

/** JSSDK bundle. 1.5.32 ships JSAPI SDK 3.1.2 and exposes both
 *  requestAccess and requestAuthCode. Single constant so a future CDN domain
 *  migration is a one-line change. */
const LARK_H5_SDK_URL =
  "https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk-1.5.32.js";

/** Feishu's webviews identify themselves in the UA (Lark = international,
 *  Feishu = cn build; both spellings appear across client versions). */
export function isLarkUserAgent(userAgent: string): boolean {
  return /Lark|Feishu/i.test(userAgent);
}

interface LarkH5Sdk {
  ready: (callback: () => void) => void;
}

/** requestAccess: client ≥6.9.0 with a recent JSSDK. Note the capitalization —
 *  appID here, appId on requestAuthCode below. */
interface LarkRequestAccess {
  (options: {
    appID: string;
    scopeList: string[];
    success: (res: { code?: string }) => void;
    fail: (err: { errno?: number }) => void;
  }): void;
}

/** requestAuthCode: the pre-6.9.0 fallback for the same one-time code. */
interface LarkRequestAuthCode {
  (options: {
    appId: string;
    success: (res: { code?: string }) => void;
    fail: (err: unknown) => void;
  }): void;
}

declare global {
  interface Window {
    h5sdk?: LarkH5Sdk;
    tt?: { requestAccess?: LarkRequestAccess; requestAuthCode?: LarkRequestAuthCode };
  }
}

/** Client code the Feishu client returns when it cannot serve requestAccess
 *  (client <6.9.0 or an older JSSDK) — the cue to fall back to
 *  requestAuthCode per the backend's integration contract. */
const ERRNO_NO_REQUEST_ACCESS = 103;

let sdkLoadPromise: Promise<void> | null = null;

function injectLarkSdkScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LARK_H5_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkLoadPromise = null; // a retry must re-attempt the load
      script.remove();
      reject(new Error("无法加载飞书 JSSDK"));
    };
    document.head.appendChild(script);
  });
}

/** Load the JSSDK once per page (idempotent across callers/retries except
 *  after an onerror, which resets the memo). Resolves when the script tag
 *  loaded; `window.h5sdk` appears at that point, but JSAPIs only work after
 *  waitLarkH5Ready. */
export function loadLarkH5Sdk(): Promise<void> {
  sdkLoadPromise ??= injectLarkSdkScript();
  return sdkLoadPromise;
}

/** Wait for `h5sdk.ready` — the Feishu client's bridge handshake. Rejects on
 *  timeout so a UA-spoofed or half-broken webview degrades to the error UI
 *  instead of hanging on the splash cover. */
export function waitLarkH5Ready(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const h5sdk = window.h5sdk;
    if (!h5sdk) {
      reject(new Error("飞书环境不可用"));
      return;
    }
    const timer = window.setTimeout(() => {
      reject(new Error("飞书环境初始化超时"));
    }, timeoutMs);
    h5sdk.ready(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });
}

/** One-shot timeout wrapper for the JSAPI callbacks: neither requestAccess
 *  nor requestAuthCode documents a guaranteed fail callback, so a hung bridge
 *  must not strand the login flow. */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(label)), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        window.clearTimeout(timer);
        reject(reason);
      },
    );
  });
}

/** Request the one-time JSAPI pre-authorization code. Tries requestAccess
 *  (scopeList: [] grants only "get logged-in user info"), falling back to
 *  requestAuthCode when the client answers errno 103. */
export function requestLarkAppCode(appId: string, timeoutMs = 15_000): Promise<string> {
  return withTimeout(
    new Promise<string>((resolve, reject) => {
      const tt = window.tt;
      if (!tt?.requestAccess) {
        // Very old JSSDK: go straight to the legacy API when present.
        if (tt?.requestAuthCode) {
          requestAuthCode(tt.requestAuthCode, appId).then(resolve, reject);
        } else {
          reject(new Error("飞书客户端不支持免登录"));
        }
        return;
      }
      tt.requestAccess({
        appID: appId,
        scopeList: [],
        success: (res) => {
          if (res.code) resolve(res.code);
          else reject(new Error("飞书未返回授权码"));
        },
        fail: (err) => {
          if (err?.errno === ERRNO_NO_REQUEST_ACCESS && window.tt?.requestAuthCode) {
            requestAuthCode(window.tt.requestAuthCode, appId).then(resolve, reject);
          } else {
            reject(new Error("未获得飞书授权"));
          }
        },
      });
    }),
    timeoutMs,
    "获取飞书授权超时",
  );
}

function requestAuthCode(
  api: LarkRequestAuthCode,
  appId: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    api({
      appId,
      success: (res) => {
        if (res.code) resolve(res.code);
        else reject(new Error("飞书未返回授权码"));
      },
      fail: () => reject(new Error("未获得飞书授权")),
    });
  });
}
