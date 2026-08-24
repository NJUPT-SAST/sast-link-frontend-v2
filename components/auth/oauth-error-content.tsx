"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Business codes the third-party login callback can redirect here with. The
 * backend sends `?error=<code>&error_description=<its own fixed string>`; the
 * description is this deployment's own copy (never provider text), so it is
 * safe to display. These fallbacks cover the case where only `error` arrives.
 *
 * See the backend's errcode package and §8.4 of the API doc.
 */
const ERROR_FALLBACKS: Record<string, string> = {
  "40000": "登录请求无效或已过期",
  "40302": "仅限 SAST 成员登录",
  "40301": "账号已注销",
  "40401": "用户不存在",
  "40903": "该第三方账号已被其他用户绑定",
  "42900": "请求过于频繁，请稍后重试",
  "50000": "服务器内部错误",
  "50300": "依赖服务暂不可用，请稍后重试",
};

/**
 * Codes worth retrying as-is: the user did nothing wrong and a second attempt
 * can succeed. Anything else (a deleted account, a foreign tenant, an occupied
 * identity) will fail again identically, so only the way back is offered.
 */
const RETRYABLE_CODES = new Set(["40000", "42900", "50000", "50300"]);

export function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("error");
  const description = searchParams.get("error_description");

  const reason =
    description?.trim() ||
    (code ? ERROR_FALLBACKS[code] : undefined) ||
    "第三方登录未能完成";
  const retryable = code === null || RETRYABLE_CODES.has(code);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="type-title3">第三方登录失败</h1>
      <p className="max-w-[360px] text-[15px] leading-[22px] text-muted-foreground">
        {reason}
        {retryable ? "。返回登录页重新发起登录即可。" : "。请换一种方式登录，或联系管理员。"}
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
