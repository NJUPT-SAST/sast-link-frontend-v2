"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";

import { consentAuthorize } from "@/lib/api/oauth";
import { toApiError } from "@/lib/api/errors";
import { redirectTo } from "@/lib/api/redirect";
import { describeOAuthScopes } from "@/lib/constants/oauth";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";

function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="grid size-14 place-items-center rounded border border-hairline bg-card">
        <span className="type-tech text-destructive">!</span>
      </div>
      <h1 className="type-title3">{title}</h1>
      <p className="max-w-[360px] text-[15px] leading-[22px] text-muted-foreground">
        {hint}
      </p>
      <Button asChild>
        <Link href="/home">返回首页</Link>
      </Button>
    </div>
  );
}

export function OAuthConsentContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request_id");
  const clientName = searchParams.get("client_name") ?? "未知应用";
  const scopes = describeOAuthScopes(searchParams.get("scope") ?? "");
  const expiresIn = Number(searchParams.get("expires_in") ?? "0");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // The backend could not verify the authorization request — it redirects here
  // instead of to the client so this page is never an open redirector.
  if (error) {
    return (
      <EmptyState
        title="授权请求无效"
        hint={errorDescription || "请求的应用信息有误，请返回原应用重新发起登录。"}
      />
    );
  }

  // Landing here without a pending request (no request_id).
  if (!requestId) {
    return (
      <EmptyState
        title="没有待处理的授权请求"
        hint="请从原应用重新发起登录。"
      />
    );
  }

  const submit = async (approve: boolean) => {
    setLoading(true);
    setSubmitError(null);
    try {
      const response = await consentAuthorize(requestId, approve);
      // The client expects a browser navigation carrying the one-time code.
      redirectTo(response.data.data.redirect_uri);
    } catch (reason) {
      setSubmitError(toApiError(reason).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-6 text-center">
      <div className="grid size-14 place-items-center rounded border border-hairline bg-card">
        <span className="type-title3">{clientName.slice(0, 1).toUpperCase()}</span>
      </div>
      <div>
        <h1 className="type-title3">{clientName}</h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          想要使用你的 SAST Link 账号进行登录
        </p>
      </div>

      <div className="w-full border border-hairline bg-card px-5 py-4 text-left">
        <p className="type-tech mb-3 text-tertiary">将授予以下权限</p>
        <ul className="flex flex-col gap-2">
          {scopes.map((scope) => (
            <li key={scope} className="flex items-center gap-2.5 text-sm">
              <Check size={15} className="shrink-0 text-success" />
              {scope}
            </li>
          ))}
        </ul>
        {expiresIn > 0 && (
          <p className="mt-3 text-xs text-tertiary">
            此请求将在 {Math.max(1, Math.round(expiresIn / 60))} 分钟后过期
          </p>
        )}
      </div>

      {submitError && <p className="w-full text-sm text-destructive">{submitError}</p>}

      <div className="flex w-full flex-col gap-3">
        <Button onClick={() => submit(true)} disabled={loading} className="w-full">
          {loading ? <DotLoading /> : "授权登录"}
        </Button>
        <Button
          variant="outline"
          onClick={() => submit(false)}
          disabled={loading}
          className="w-full"
        >
          拒绝
        </Button>
      </div>
      <p className="text-xs text-tertiary">授权即表示你同意该应用访问上述信息</p>
    </div>
  );
}
