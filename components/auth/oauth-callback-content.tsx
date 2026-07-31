"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { toApiError } from "@/lib/api/errors";
import { exchangeLoginCode } from "@/lib/api/oauth";
import { createSession, setSession } from "@/lib/token";
import { useUserListStore } from "@/store/use-user-list-store";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface OAuthCallbackContentProps {
  provider: { name: string; icon: ReactNode };
}

function Steps({ failed }: { failed: boolean }) {
  const steps = ["授权", failed ? "兑换失败" : "兑换", "建立会话"];
  return (
    <div className="flex items-center">
      {steps.map((label, index) => (
        <Fragment key={label}>
          {index > 0 && <span className="mx-3 h-px w-10 bg-input" />}
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
  const addAccount = useUserListStore((state) => state.addAccount);
  const resetProfile = useUserProfileStore((state) => state.resetProfile);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const exchangedRef = useRef(false);
  const code = searchParams.get("code");
  const inputError =
    searchParams.get("error_description") ||
    (!code && !searchParams.get("registration_state")
      ? "OAuth 回调缺少登录码"
      : null);

  useEffect(() => {
    const registrationState = searchParams.get("registration_state");
    if (registrationState) {
      const params = new URLSearchParams(searchParams.toString());
      router.replace(`/register?${params.toString()}`);
      return;
    }

    if (!code) return;
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    exchangeLoginCode(code)
      .then((response) => {
        const data = response.data.data;
        const session = createSession(
          data.access_token,
          data.refresh_token,
          data.expires_in,
        );
        setSession(session);
        resetProfile();
        addAccount({
          userId: data.user.id,
          loginEmail: data.user.login_email,
          name: data.user.name,
          avatar: null,
          session,
        });
        router.replace("/home");
      })
      .catch((reason) => setExchangeError(toApiError(reason).message));
  }, [addAccount, code, router, searchParams]);

  const error = inputError || exchangeError;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="grid size-14 place-items-center rounded border border-hairline bg-card [&_img]:size-7 [&_svg]:size-7">
        {provider.icon}
      </div>
      {error ? (
        <>
          <h1 className="type-title3">登录链接已失效</h1>
          <Steps failed />
          <p className="max-w-[360px] text-[15px] leading-[22px] text-muted-foreground">
            {error}。返回登录页重新发起 {provider.name} 登录即可。
          </p>
          <div className="mt-2 flex gap-3">
            <Button onClick={() => router.replace("/login")}>重新尝试</Button>
            <Button variant="outline" onClick={() => router.replace("/login")}>返回登录</Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="type-title3">正在通过{provider.name}登录</h1>
          <Steps failed={false} />
          <p className="type-tech text-tertiary">Exchanging code</p>
          <Loader2 size={28} className="animate-spin text-link" />
        </>
      )}
    </div>
  );
}
