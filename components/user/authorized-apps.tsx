"use client";

import { useState } from "react";
import useSWR from "swr";

import { getGrants, revokeGrant, type OAuthGrant } from "@/lib/api/oauth";
import { toApiError } from "@/lib/api/errors";
import { message } from "@/lib/message";
import { describeOAuthScopes } from "@/lib/constants/oauth";
import { CLIENT_TYPE_LABELS } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
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
  const { data, mutate } = useSWR("user:oauth:grants", () =>
    getGrants().then((r) => r.data.data.grants),
  );
  const [detail, setDetail] = useState<OAuthGrant | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const grants = data ?? [];

  const revoke = async (clientId: number, name: string) => {
    setRevokingId(clientId);
    try {
      await revokeGrant(clientId);
      message.success(`已撤销 ${name} 的授权`);
      setDetail(null);
      mutate();
    } catch (error) {
      message.error(toApiError(error).message);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="border-t border-hairline">
      {grants.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">你还没有授权任何应用</p>
      ) : (
        <ul>
          {grants.map((grant) => (
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
                <Button variant="ghost" size="sm" onClick={() => setDetail(grant)}>
                  查看
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revoke(grant.client_id, grant.client_name)}
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
        <DialogContent className="border-border/60 bg-card/95 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="type-title3">{detail?.client_name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              已授权应用信息
            </DialogDescription>
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
                onClick={() => revoke(detail.client_id, detail.client_name)}
                disabled={revokingId === detail.client_id}
              >
                {revokingId === detail.client_id ? <DotLoading /> : "撤销授权"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
