"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { CODE_PASSWORD_INVALID } from "@/lib/api/error-codes";
import { IDENTITY_PROVIDERS } from "@/lib/constants/providers";
import { useIdentities } from "@/hooks/use-identities";
import { accountKey } from "@/lib/api/profile";
import { AccountLoadError } from "@/components/user/account-load-error";
import { message } from "@/lib/message";
import { toApiError } from "@/lib/api/errors";
import { buildBindOAuthUrl } from "@/lib/api/oauth";
import { unbindIdentity } from "@/lib/api/user";
import type { Identity } from "@/lib/api/types";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface IdentityListProps {
  /** show bind/unbind action buttons (settings third-party section) */
  actionable?: boolean;
}

/**
 * Provider list with bound/unbound status. Shared by the profile side panel
 * (read-only) and the settings page (with bind/unbind actions).
 */
export function IdentityList({ actionable }: IdentityListProps) {
  const sessionKey = accountKey("identity-actions");
  return <IdentityActions key={sessionKey} actionable={actionable} sessionKey={sessionKey} />;
}

function IdentityActions({ actionable, sessionKey }: IdentityListProps & { sessionKey: string | null }) {
  const { identities, isLoading, error: loadError, isValidating, mutate } = useIdentities();
  const [unbindTarget, setUnbindTarget] = useState<Identity | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // True only when the last unbind failed the password check (40105). That is
  // the one unbind failure with a self-service exit: the backend has no
  // set-initial-password endpoint, so the only passwordless way back in is the
  // email-code reset flow — worth pointing at instead of a retry loop.
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const closeUnbind = () => {
    setUnbindTarget(null);
    setPassword("");
    setError("");
    setPasswordInvalid(false);
  };

  const handleBind = (key: "github" | "lark") => {
    const url = buildBindOAuthUrl(key);
    if (!url) {
      message.warning("未配置第三方绑定，请联系管理员");
      return;
    }
    // Navigate in the same tab — the provider bounces back to /oauth/bind/{provider},
    // so a new window is just an extra tab with no benefit (and can be popup-blocked).
    window.location.assign(url);
  };

  const handleUnbind = async () => {
    if (!unbindTarget || submitting.current) return;
    if (!password) {
      setError("请输入当前密码");
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError("");
    const current = () => mounted.current && sessionKey === accountKey("identity-actions");
    try {
      await unbindIdentity(unbindTarget.id, password);
      if (!current()) return;
      message.success("已解绑");
      mutate();
      closeUnbind();
    } catch (error) {
      if (current()) {
      const apiError = toApiError(error);
      setError(apiError.message);
      setPasswordInvalid(apiError.code === CODE_PASSWORD_INVALID);
      }
    } finally {
      submitting.current = false;
      if (current()) setLoading(false);
    }
  };

  if (loadError) return <AccountLoadError title="第三方账号加载失败" error={loadError} retrying={isValidating} onRetry={mutate} />;

  return (
    <>
      {IDENTITY_PROVIDERS.map((provider) => {
        const bound = identities.some(
          (identity) => identity.provider === provider.key,
        );
        const boundIdentity = identities.find(
          (identity) => identity.provider === provider.key,
        );
        return (
          <div
            key={provider.key}
            className="flex min-h-[52px] items-center justify-between border-b border-hairline py-3 text-sm last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={provider.icon}
                alt=""
                width={18}
                height={18}
                className="shrink-0 dark:invert"
              />
              <span className="truncate">{provider.name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3.5">
              <span
                className={`flex items-center gap-1.5 text-xs ${
                  bound ? "text-success" : "text-tertiary"
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="size-1.5 rounded-full bg-tertiary" />
                    加载中
                  </>
                ) : (
                  <>
                    <span
                      className={`size-1.5 ${
                        bound ? "status-dot-pulse bg-current" : "bg-tertiary"
                      }`}
                    />
                    {bound ? "已绑定" : "未绑定"}
                  </>
                )}
              </span>
              {actionable && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={
                    bound
                      ? (event) => {
                          opener.current = event.currentTarget;
                          setPassword("");
                          setError("");
                          setPasswordInvalid(false);
                          setUnbindTarget(boundIdentity ?? null);
                        }
                      : () => handleBind(provider.key)
                  }
                >
                  {bound ? "解绑" : "绑定"}
                </Button>
              )}
            </span>
          </div>
        );
      })}

      {/* Unbind password-confirmation dialog */}
      <Dialog
        open={unbindTarget !== null}
        onOpenChange={(open) => {
          if (!open && !submitting.current) closeUnbind();
        }}
      >
        <DialogContent className="border-border/60 bg-card/95 sm:max-w-md" showCloseButton={!loading}
          onEscapeKeyDown={(event) => { if (loading) event.preventDefault(); }}
          onInteractOutside={(event) => { if (loading) event.preventDefault(); }}
          onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus(); }}>
          <DialogHeader>
            <DialogTitle>解绑第三方账号</DialogTitle>
            <DialogDescription>
              确认解绑
              {unbindTarget
                ? IDENTITY_PROVIDERS.find(
                    (p) => p.key === unbindTarget.provider,
                  )?.name ?? "该账号"
                : ""}
              ？
            </DialogDescription>
          </DialogHeader>
          {/* Inform, don't block: the backend permits unbinding the last
              identity whenever a login email exists, so the only frontend job
              left is spelling out the consequence. */}
          {identities.length === 1 && (
            <p className="text-xs text-tertiary">
              这是当前唯一的第三方绑定，解绑后将只能使用邮箱密码登录。
            </p>
          )}
          <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void handleUnbind(); }}>
            <AuthFormField
              label="当前密码"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Retyping means the user may be back on track — the reset
                // hint only makes sense right after a 40105 failure.
                setPasswordInvalid(false);
              }}
              error={error}
              disabled={loading}
            />
            {passwordInvalid && (
              <p className="text-xs text-tertiary">
                忘记了密码？{" "}
                <Link href="/reset" className="text-link hover:underline">
                  通过邮箱验证码重置
                </Link>
              </p>
            )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeUnbind} disabled={loading}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <DotLoading /> : "确认解绑"}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
