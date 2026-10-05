"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  CODE_DEPENDENCY_UNAVAILABLE,
  CODE_INTERNAL,
  CODE_RATE_LIMITED,
  CODE_VALIDATION,
} from "@/lib/api/error-codes";
import {
  buildOAuthLoginUrl,
  markOAuthLoginInitiated,
  type OAuthProvider,
} from "@/lib/api/oauth";

/**
 * Codes worth retrying as-is: the user did nothing wrong and a second attempt
 * can succeed. Anything else (a deleted account, a foreign tenant, an occupied
 * identity) will fail again identically, so the page says to contact an admin
 * instead. The backend redirects back with the code as an ?error= string, so
 * the set is keyed on the String() form of the constants.
 */
const RETRYABLE_CODES = new Set(
  [CODE_VALIDATION, CODE_RATE_LIMITED, CODE_INTERNAL, CODE_DEPENDENCY_UNAVAILABLE].map(String),
);

/** Full restart-button copy per provider (backend PR #103's error
 *  redirect carries ?provider=). CJK needs no padding around 飞书, while the
 *  Latin brand reads better spaced. */
const RESTART_LABELS: Record<OAuthProvider, string> = {
  github: "重试 GitHub 登录",
  lark: "重试飞书登录",
};

/** The backend adds ?provider= to the error redirect so the page can offer a
 *  one-click restart. Anything but the known providers (hand-edited links)
 *  degrades to the plain display. */
function parseProvider(raw: string | null): OAuthProvider | null {
  return raw === "github" || raw === "lark" ? raw : null;
}

export function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("error");
  const description = searchParams.get("error_description");
  const provider = parseProvider(searchParams.get("provider"));

  // The backend owns the copy: error_description is this deployment's fixed
  // string (never provider text), so it is displayed verbatim. A missing
  // description means the link was hand-edited or truncated — render only the
  // advice line, which carries the action; repeating the h1 would be noise.
  const reason = description?.trim() || null;
  // An empty ?error= is the same degraded link shape as a missing one and
  // should follow the same retryable path, not the terminal one.
  const retryable = code === null || code.trim() === "" || RETRYABLE_CODES.has(code);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="type-title3">第三方登录失败</h1>
      <p className="max-w-[360px] text-[15px] leading-[22px] text-muted-foreground">
        {reason ? `${reason}。` : ""}
        {retryable ? "请稍后重试或换用其他登录方式。" : "请联系管理员。"}
      </p>
      {code && (
        <p className="type-tech text-tertiary" data-testid="oauth-error-code">
          错误码 {code}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-2">
        {provider && (
          <Button asChild>
            {/* Plain anchor: the login restart is a hard GET to the backend
                OAuth entry, outside the static-export router. No ?redirect=
                is attached — this page cannot know the pre-login page, and the
                login-page buttons send none either, so the backend falls back
                to its default post-login address. The click also stamps this
                tab as having initiated the jump, arming the callback guard. */}
            <a
              href={buildOAuthLoginUrl(provider)}
              onClick={() => markOAuthLoginInitiated(provider)}
            >
              {RESTART_LABELS[provider]}
            </a>
          </Button>
        )}
        <Button asChild variant={provider ? "outline" : "default"}>
          <Link href="/login">返回登录</Link>
        </Button>
      </div>
    </div>
  );
}
