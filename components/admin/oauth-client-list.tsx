import type { AdminOAuthClient } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  CLIENT_TYPE_LABELS,
  GRANT_TYPE_LABELS,
  SCOPE_LABELS,
} from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";

interface OAuthClientListProps {
  clients: AdminOAuthClient[];
  loading?: boolean;
  onEdit: (client: AdminOAuthClient) => void;
  onToggleActive: (client: AdminOAuthClient) => void;
}

export function OAuthClientList({
  clients,
  loading = false,
  onEdit,
  onToggleActive,
}: OAuthClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center border-t border-hairline text-sm text-tertiary">
        还没有 OAuth 客户端
      </div>
    );
  }

  return (
    <div className="border-t border-hairline">
      <div className="hidden grid-cols-[60px_1fr_100px_80px_1fr_120px_120px_120px] gap-4 border-b border-hairline py-3 text-xs text-tertiary lg:grid">
        <div>ID</div>
        <div>名称</div>
        <div>类型</div>
        <div>状态</div>
        <div>回调地址</div>
        <div>授权类型</div>
        <div>Scope</div>
        <div className="text-right" aria-hidden />
      </div>
      {clients.map((client) => {
        const isInternal = client.client_id === "sast-link-web";
        return (
          <div
            key={client.id}
            className="grid grid-cols-1 gap-2 border-b border-hairline py-4 text-sm lg:grid-cols-[60px_1fr_100px_80px_1fr_120px_120px_120px] lg:items-center lg:gap-4"
          >
            <div className="text-tertiary">#{client.id}</div>
            <div className="font-medium">{client.client_name}</div>
            <div className="text-tertiary">{CLIENT_TYPE_LABELS[client.client_type]}</div>
            <div>
              <span
                className={cn(
                  "inline-flex items-center rounded px-2 py-0.5 text-xs",
                  client.is_active
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {client.is_active ? "启用" : "停用"}
              </span>
            </div>
            <div
              className="truncate text-tertiary"
              title={client.redirect_uris.join("、")}
            >
              {client.redirect_uris.join("、")}
            </div>
            <div
              className="truncate text-tertiary"
              title={client.grant_types.map((g) => GRANT_TYPE_LABELS[g]).join("、")}
            >
              {client.grant_types.map((g) => GRANT_TYPE_LABELS[g]).join("、")}
            </div>
            <div
              className="truncate text-tertiary"
              title={client.scopes.map((s) => SCOPE_LABELS[s]).join("、")}
            >
              {client.scopes.map((s) => SCOPE_LABELS[s]).join("、")}
            </div>
            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(client)}
                disabled={loading}
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleActive(client)}
                disabled={loading || isInternal}
                className={cn(
                  !isInternal && !client.is_active && "text-success hover:text-success",
                )}
                title={isInternal ? "内置客户端不可停用" : undefined}
              >
                {client.is_active ? "停用" : "启用"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
