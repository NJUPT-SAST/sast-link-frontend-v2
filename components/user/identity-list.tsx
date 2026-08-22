"use client";

import { useState } from "react";

import { IDENTITY_PROVIDERS } from "@/lib/constants/providers";
import { useIdentities } from "@/hooks/use-identities";
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
  const { identities, isLoading, mutate } = useIdentities();
  const [unbindTarget, setUnbindTarget] = useState<Identity | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const closeUnbind = () => {
    setUnbindTarget(null);
    setPassword("");
    setError("");
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
    if (!unbindTarget) return;
    if (!password) {
      setError("请输入当前密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await unbindIdentity(unbindTarget.id, password);
      message.success("已解绑");
      mutate();
      closeUnbind();
    } catch (error) {
      setError(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

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
                      ? () => {
                          setPassword("");
                          setError("");
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
          if (!open) closeUnbind();
        }}
      >
        <DialogContent className="border-border/60 bg-card/95 sm:max-w-md">
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
          <div className="flex flex-col gap-4">
            <AuthFormField
              label="当前密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUnbind}>
              取消
            </Button>
            <Button onClick={handleUnbind} disabled={loading}>
              {loading ? <DotLoading /> : "确认解绑"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
