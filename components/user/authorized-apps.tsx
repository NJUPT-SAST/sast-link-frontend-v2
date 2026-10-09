"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

import { getGrants, revokeGrant, type OAuthGrant } from "@/lib/api/oauth";
import { toApiError } from "@/lib/api/errors";
import { accountKey } from "@/lib/api/profile";
import { message } from "@/lib/message";
import { describeOAuthScopes } from "@/lib/constants/oauth";
import { CLIENT_TYPE_LABELS } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { AccountLoadError } from "@/components/user/account-load-error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 text-sm">
      <span className="text-tertiary">{label}</span>
      <span className="break-words text-foreground">{value || "—"}</span>
    </div>
  );
}

/** "已授权应用" — the applications the user signed into via SAST Link's OAuth,
 *  with a detail view and a one-tap revoke. */
export function AuthorizedApps() {
  const sessionKey = accountKey("user:oauth:grants");
  return <AccountAuthorizedApps key={sessionKey} sessionKey={sessionKey} />;
}

function AccountAuthorizedApps({ sessionKey }: { sessionKey: string | null }) {
  const { data, error, isValidating, mutate } = useSWR(sessionKey, () =>
    getGrants().then((r) => r.data.data.grants),
  );
  const [detail, setDetail] = useState<OAuthGrant | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    clientId: number;
    name: string;
  } | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const detailOpener = useRef<HTMLButtonElement | null>(null);
  const confirmOpener = useRef<HTMLButtonElement | null>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const restoreFocus = (opener: HTMLButtonElement | null) => {
    if (opener?.isConnected && !opener.disabled) opener.focus();
    else list.current?.focus();
  };

  const revoke = async (clientId: number, name: string) => {
    if (busy.current) return;
    busy.current = true;
    setRevokingId(clientId);
    const current = () => mounted.current && sessionKey === accountKey("user:oauth:grants");
    try {
      await revokeGrant(clientId);
      if (!current()) return;
      message.success(`已撤销 ${name} 的授权`);
      setConfirmTarget(null);
      setDetail(null);
      void mutate((grants) => grants?.filter((grant) => grant.client_id !== clientId));
    } catch (error) {
      if (current()) message.error(toApiError(error).message);
    } finally {
      busy.current = false;
      if (current()) setRevokingId(null);
    }
  };

  return (
    <div ref={list} tabIndex={-1} className="border-t border-hairline">
      {error && <AccountLoadError title="已授权应用加载失败" error={error} retrying={isValidating} onRetry={mutate} />}
      {!sessionKey ? <p role="status" className="py-4 text-sm text-muted-foreground">请先登录后查看已授权应用</p> : data === undefined ? (!error && <p role="status" className="py-4 text-sm text-muted-foreground">正在加载已授权应用…</p>) : data.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">你还没有授权任何应用</p>
      ) : (
        <ul>
          {data.map((grant) => (
            <li
              key={grant.client_id}
              className="flex items-center justify-between gap-4 border-b border-hairline py-3 text-sm last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{grant.client_name}</div>
                <div className="mt-0.5 truncate text-xs text-tertiary">
                  {describeOAuthScopes((grant.scopes ?? []).join(" ")).join(" · ")}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" size="sm" onClick={(event) => { detailOpener.current = event.currentTarget; setDetail(grant); }}>
                  查看
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    confirmOpener.current = event.currentTarget;
                    setConfirmTarget({
                      clientId: grant.client_id,
                      name: grant.client_name,
                    });
                  }}
                  disabled={revokingId === grant.client_id}
                >
                  {revokingId === grant.client_id ? <DotLoading /> : "撤销授权"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={detail !== null} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent aria-describedby={undefined} className="border-border/60 bg-card/95 sm:max-w-md"
          onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(detailOpener.current); }}>
          <DialogHeader>
            <DialogTitle className="type-title3">{detail?.client_name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Field
              label="类型"
              value={
                detail
                  ? (CLIENT_TYPE_LABELS as Record<string, string>)[detail.client_type] ??
                    detail.client_type
                  : undefined
              }
            />
            <Field
              label="权限"
              value={detail ? describeOAuthScopes((detail.scopes ?? []).join(" ")).join(" · ") : undefined}
            />
            <Field label="回调地址" value={(detail?.redirect_uris ?? []).join(", ")} />
            <Field
              label="授权时间"
              value={detail ? new Date(detail.last_authorized_at).toLocaleString() : undefined}
            />
            <Field label="状态" value={detail ? (detail.is_active ? "激活" : "已停用") : undefined} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>
              关闭
            </Button>
            {detail && (
              <Button
                onClick={(event) => {
                  confirmOpener.current = event.currentTarget;
                  setConfirmTarget({
                    clientId: detail.client_id,
                    name: detail.client_name,
                  });
                }}
                disabled={revokingId === detail.client_id}
              >
                {revokingId === detail.client_id ? <DotLoading /> : "撤销授权"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke is destructive — require an explicit confirmation first. */}
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open && !busy.current) setConfirmTarget(null);
        }}
      >
        <DialogContent className="border-border/60 bg-card/95 sm:max-w-md" showCloseButton={revokingId === null}
          onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(confirmOpener.current); }}>
          <DialogHeader>
            <DialogTitle>撤销授权</DialogTitle>
            <DialogDescription>
              撤销后将失去对「{confirmTarget?.name}」的登录授权，需重新授权才能恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={revokingId !== null} onClick={() => setConfirmTarget(null)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (!confirmTarget) return;
                const target = confirmTarget;
                void revoke(target.clientId, target.name);
              }}
              disabled={revokingId === confirmTarget?.clientId}
            >
              {revokingId === confirmTarget?.clientId ? <DotLoading /> : "确认撤销"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
