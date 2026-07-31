"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { toApiError } from "@/lib/api/errors";
import { consumeBindState } from "@/lib/api/oauth";
import type { OAuthProvider } from "@/lib/api/oauth";
import { bindGithub, bindLark } from "@/lib/api/user";
import {
  FEISHU_BIND_REDIRECT_URI,
  GITHUB_BIND_REDIRECT_URI,
} from "@/lib/config/public";
import { message } from "@/lib/message";
import { useIdentities } from "@/hooks/use-identities";
import { Button } from "@/components/ui/button";

interface OAuthBindContentProps {
  provider: OAuthProvider;
  providerName: string;
  icon: ReactNode;
}

export function OAuthBindContent({
  provider,
  providerName,
  icon,
}: OAuthBindContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate } = useIdentities();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // Synchronous validation failures bounce back with a toast — no React state
    // needed for an outcome the user cannot act on here.
    if (!code) {
      message.error("缺少授权码");
      router.replace("/settings");
      return;
    }
    if (!consumeBindState(provider, state)) {
      message.error("授权校验失败，请重新发起绑定");
      router.replace("/settings");
      return;
    }

    // The `code` is single-use — never retry the request on this page load.
    const redirectUri =
      provider === "lark" ? FEISHU_BIND_REDIRECT_URI : GITHUB_BIND_REDIRECT_URI;
    const bind = provider === "lark" ? bindLark : bindGithub;

    bind(code, redirectUri || undefined)
      .then(() => {
        message.success("绑定成功");
        mutate();
        router.replace("/settings");
      })
      .catch((reason) => setError(toApiError(reason).message));
  }, [code, mutate, provider, router, state]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-14 place-items-center rounded border border-hairline bg-card [&_img]:size-7 [&_svg]:size-7">
          {icon}
        </div>
        <h1 className="type-title3">绑定失败</h1>
        <p className="max-w-[360px] text-[15px] leading-[22px] text-muted-foreground">
          {error}。请返回设置页重新发起绑定。
        </p>
        <Button onClick={() => router.replace("/settings")}>返回设置</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="grid size-14 place-items-center rounded border border-hairline bg-card [&_img]:size-7 [&_svg]:size-7">
        {icon}
      </div>
      <h1 className="type-title3">正在绑定{providerName}</h1>
      <p className="type-tech text-tertiary">Exchanging code</p>
      <Loader2 size={28} className="animate-spin text-link" />
    </div>
  );
}
