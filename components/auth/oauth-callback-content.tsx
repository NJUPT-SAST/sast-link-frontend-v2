"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { toApiError } from "@/lib/api/errors";
import { hasRecentOAuthLoginInitiation } from "@/lib/api/oauth";
import { establishLoginCodeSession } from "@/lib/login-session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface OAuthCallbackContentProps {
  provider: { name: string; icon: ReactNode };
}

function Steps({ failed, cancelled }: { failed: boolean; cancelled?: boolean }) {
  const steps = ["授权", cancelled ? "登录取消" : failed ? "登录失败" : "登录", "完成"];
  return (
    <div className="flex flex-wrap items-center justify-center">
      {steps.map((label, index) => (
        <Fragment key={label}>
          {index > 0 && <span className="mx-2 h-px w-6 bg-input sm:mx-3 sm:w-10" />}
          <span
            className={cn(
              "text-[13px]",
              index === 1
                ? failed
                  ? "font-semibold text-destructive"
                  : "font-semibold text-foreground"
                : "text-tertiary",
            )}
          >
            {label}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

export function OAuthCallbackContent({ provider }: OAuthCallbackContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const exchangedRef = useRef(false);
  // The code stashed before the URL is stripped. Next's router patches
  // history.replaceState, so stripping the URL also empties useSearchParams —
  // without the stash, a failed exchange could never be retried (the effect
  // would see no code) and the page would mis-report 缺少授权信息.
  const [stashedCode, setStashedCode] = useState<string | null>(null);
  const code = searchParams.get("code");
  const effectiveCode = code ?? stashedCode;
  // The provider bounces back with an `error` query when the user cancels the
  // consent step — treat that as a cancellation, not a stale link.
  const cancelled = searchParams.get("error") !== null;
  // login_code is a bearer one-time code with no browser binding: a callback
  // URL whose redirect was never initiated from this tab is a planted
  // link-drop / login-CSRF payload. No recent initiation stamp (see
  // markOAuthLoginInitiated) → render the stop page and skip the exchange.
  const uninitiated =
    code !== null && !cancelled && !hasRecentOAuthLoginInitiation();
  const inputError = cancelled
    ? null
    : searchParams.get("error_description") ||
      (!effectiveCode && !searchParams.get("registration_state")
        ? "缺少授权信息，请重新登录"
        : null);

  useEffect(() => {
    const registrationState = searchParams.get("registration_state");
    if (registrationState) {
      const params = new URLSearchParams(searchParams.toString());
      router.replace(`/register?${params.toString()}`);
      return;
    }

    if (!effectiveCode) return;
    if (uninitiated) return;
    if (exchangedRef.current) return;
    exchangedRef.current = true;
    setExchangeError(null);
    // Stash before stripping: Next syncs useSearchParams with
    // history.replaceState, so the retry below reads the code from the stash.
    setStashedCode(effectiveCode);
    // The code must not linger in the URL: it leaks via Referer headers on
    // outbound requests and via shared history entries once exchanged.
    window.history.replaceState(null, "", "/oauth/callback");

    establishLoginCodeSession(effectiveCode)
      .then((destination) => router.replace(destination))
      .catch((reason) => setExchangeError(toApiError(reason).message));
  }, [effectiveCode, router, searchParams, retryCount, uninitiated]);

  const handleRetry = () => {
    exchangedRef.current = false;
    setExchangeError(null);
    setRetryCount((count) => count + 1);
  };

  const error = inputError || exchangeError;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="grid size-14 place-items-center rounded border border-hairline bg-card [&_img]:size-7 [&_svg]:size-7">
        {provider.icon}
      </div>
      {cancelled ? (
        <>
          <h1 className="type-title3">第三方登录被取消</h1>
          <Steps failed={false} cancelled />
          <p className="max-w-[360px] text-[15px] leading-[22px] text-muted-foreground">
            你已手动取消，{provider.name}登录未完成。
          </p>
          <div className="mt-2">
            <Button onClick={() => router.replace("/login")}>返回登录</Button>
          </div>
        </>
      ) : uninitiated ? (
        <>
          <h1 className="type-title3">登录已停止</h1>
          <Steps failed />
          <p className="max-w-[360px] text-[15px] leading-[22px] text-muted-foreground">
            该链接不是从本站发起的登录，为防止他人冒充已停止自动登录。请回到登录页重新发起。
          </p>
          <div className="mt-2">
            <Button onClick={() => router.replace("/login")}>返回登录</Button>
          </div>
        </>
      ) : error ? (
        <>
          <h1 className="type-title3">登录链接已失效</h1>
          <Steps failed />
          <p className="max-w-[360px] text-[15px] leading-[22px] text-muted-foreground">
            {error}。返回登录页重新发起 {provider.name} 登录即可。
          </p>
          <div className="mt-2 flex gap-3">
            {exchangeError !== null && (
              <Button variant="outline" onClick={handleRetry}>
                重新尝试
              </Button>
            )}
            <Button onClick={() => router.replace("/login")}>返回登录</Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="type-title3">正在通过{provider.name}登录</h1>
          <Steps failed={false} />
          <p className="type-tech text-tertiary">正在建立会话…</p>
          <Loader2 size={28} className="animate-spin text-link" />
        </>
      )}
    </div>
  );
}
