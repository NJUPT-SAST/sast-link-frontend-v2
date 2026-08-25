"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Codes worth retrying as-is: the user did nothing wrong and a second attempt
 * can succeed. Anything else (a deleted account, a foreign tenant, an occupied
 * identity) will fail again identically, so the page says to contact an admin
 * instead.
 */
const RETRYABLE_CODES = new Set(["40000", "42900", "50000", "50300"]);

export function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("error");
  const description = searchParams.get("error_description");

  // The backend owns the copy: error_description is this deployment's fixed
  // string (never provider text), so it is displayed verbatim. A missing
  // description means the link was hand-edited or truncated, which the generic
  // line covers — the advice below it carries the action.
  const reason = description?.trim() || "第三方登录未能完成";
  // An empty ?error= is the same degraded link shape as a missing one and
  // should follow the same retryable path, not the terminal one.
  const retryable = code === null || code.trim() === "" || RETRYABLE_CODES.has(code);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="type-title3">第三方登录失败</h1>
      <p className="max-w-[360px] text-[15px] leading-[22px] text-muted-foreground">
        {reason}
        {retryable ? "。请稍后重试或换用其他登录方式。" : "。请联系管理员。"}
      </p>
      {code && (
        <p className="type-tech text-tertiary" data-testid="oauth-error-code">
          错误码 {code}
        </p>
      )}
      <div className="mt-2">
        <Button asChild>
          <Link href="/login">返回登录</Link>
        </Button>
      </div>
    </div>
  );
}
