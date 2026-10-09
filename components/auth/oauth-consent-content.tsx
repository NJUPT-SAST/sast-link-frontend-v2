"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";

import {
  consentAuthorize,
  getConsentInfo,
  type OAuthConsentInfo,
} from "@/lib/api/oauth";
import { toApiError, type ApiError } from "@/lib/api/errors";
import { redirectTo } from "@/lib/api/redirect";
import { describeOAuthScopes } from "@/lib/constants/oauth";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";

function EmptyState({
  title,
  hint,
  onRetry,
  login = false,
}: {
  title: string;
  hint: string;
  onRetry?: () => void;
  login?: boolean;
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
      <div className="flex gap-3">
        {onRetry && <Button onClick={onRetry}>重试</Button>}
        <Button variant={onRetry ? "outline" : "default"} asChild>
          <Link href={login ? "/login" : "/home"}>{login ? "重新登录" : "返回首页"}</Link>
        </Button>
      </div>
    </div>
  );
}

export function OAuthConsentContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request_id");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  return <ConsentRequest key={`${requestId}:${error}`} requestId={requestId} error={error} errorDescription={errorDescription} />;
}

function ConsentRequest({ requestId, error, errorDescription }: {
  requestId: string | null;
  error: string | null;
  errorDescription: string | null;
}) {

  const [info, setInfo] = useState<OAuthConsentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch the pending request's verified client metadata from the backend. The
  // request_id in the URL is only the opaque handle; client_name/scopes are
  // never read from the query string — a crafted consent link could otherwise
  // spoof which application is asking.
  useEffect(() => {
    if (!requestId || error) return;
    let cancelled = false;
    getConsentInfo(requestId)
      .then((response) => {
        if (cancelled) return;
        setInfo(response.data.data);
        setLoadError(null);
      })
      .catch((reason) => {
        if (!cancelled) setLoadError(toApiError(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId, error, attempt]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-14 place-items-center">
          <DotLoading />
        </div>
        <p className="type-tech text-tertiary">正在加载授权信息…</p>
      </div>
    );
  }

  if (loadError) {
    const status = loadError.status;
    if (status === 401) return <EmptyState title="登录已过期" hint="请重新登录后继续授权。" login />;
    if (status === 403) return <EmptyState title="无法访问此授权请求" hint="当前账号没有权限处理此请求，请返回原应用确认登录账号。" />;
    const retryable = !status || status >= 500 || status === 408 || status === 429;
    if (retryable) {
      return <EmptyState
        title="暂时无法加载授权信息"
        hint={status === 429 ? "请求过于频繁，请稍后重试。" : "网络或服务暂时不可用，你可以重试当前授权请求。"}
        onRetry={() => { setLoading(true); setLoadError(null); setAttempt((value) => value + 1); }}
      />;
    }
    return <EmptyState title="授权请求无效" hint="该请求已失效或无法识别，请返回原应用重新发起登录。" />;
  }

  if (!info) {
    return (
      <EmptyState
        title="授权请求无效"
        hint="无法读取该请求，请返回原应用重新发起登录。"
      />
    );
  }

  const clientName = info.client_name;
  const scopes = describeOAuthScopes(info.scopes.join(" "));
  const expiresIn = info.expires_in;

  const submit = async (approve: boolean) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await consentAuthorize(requestId, approve);
      // The client expects a browser navigation carrying the one-time code.
      redirectTo(response.data.data.redirect_uri);
    } catch (reason) {
      setSubmitError(toApiError(reason).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-6 text-center">
      <div className="grid size-14 place-items-center rounded border border-hairline bg-card">
        <span className="type-title3">{clientName.slice(0, 1).toUpperCase()}</span>
      </div>
      <div>
        <h1 className="type-title3 break-words">{clientName}</h1>
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
        <Button onClick={() => submit(true)} disabled={submitting} className="w-full">
          {submitting ? <DotLoading /> : "授权登录"}
        </Button>
        <Button
          variant="outline"
          onClick={() => submit(false)}
          disabled={submitting}
          className="w-full"
        >
          拒绝
        </Button>
      </div>
      <p className="text-xs text-tertiary">
        授权即表示你同意该应用访问上述信息，并遵循
        <Link href="/terms" className="text-link hover:underline">
          《用户协议》
        </Link>
        与
        <Link href="/privacy" className="text-link hover:underline">
          《隐私政策》
        </Link>
      </p>
    </div>
  );
}
