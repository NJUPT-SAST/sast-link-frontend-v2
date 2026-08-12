import type { AdminOAuthClient } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { CLIENT_TYPE_LABELS, formatScope } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";

interface OAuthClientListProps {
  clients: AdminOAuthClient[];
  loading?: boolean;
  onEdit: (client: AdminOAuthClient) => void;
  onToggleActive: (client: AdminOAuthClient) => void;
  onDelete: (client: AdminOAuthClient) => void;
}

// The client registry reads as a table on desktop: name and callback carry the
// real width, the scope column wraps chips, and the action column holds three
// outlined buttons at a fixed width so the header's empty action cell and each
// row's buttons resolve to the same track — an `auto` action column would size
// by content and skew every fr column differently between the header and the
// rows. Below the header breakpoint each row collapses to a two-column card:
// `order-*` reflows the cells so the name leads full-width, identity (id +
// type) sits side by side, then status / callback / scope / actions each on
// their own row — nothing stacks into an undifferentiated vertical column.
// These are full literal class tokens — Tailwind scans source text, so the
// arbitrary grid value cannot be assembled at runtime.
const GRID_COLS =
  "grid-cols-[56px_minmax(0,0.7fr)_90px_76px_minmax(0,1fr)_minmax(0,1.2fr)_200px]";
const GRID_COLS_LG =
  "lg:grid-cols-[56px_minmax(0,0.7fr)_90px_76px_minmax(0,1fr)_minmax(0,1.2fr)_200px]";
// Every cell after the ID column gets a leading rule on desktop.
const CELL_RULE = "lg:border-l lg:border-hairline lg:pl-4";
// On mobile, a cell spans the full card; desktop restores it to one column.
const CELL_SPAN_FULL = "col-span-2 lg:col-span-1";
// Mobile reorders the DOM (which must match the desktop column order) so the
// name leads the card; lg:order-none restores the table order. Written out as
// literals per index — Tailwind scans source text and cannot see a runtime
// `order-${n}` template.
const CELL_ORDER = (n: number) =>
  n === 2
    ? "order-2 lg:order-none"
    : n === 3
      ? "order-3 lg:order-none"
      : n === 4
        ? "order-4 lg:order-none"
        : n === 5
          ? "order-5 lg:order-none"
          : n === 6
            ? "order-6 lg:order-none"
            : "order-7 lg:order-none";

export function OAuthClientList({
  clients,
  loading = false,
  onEdit,
  onToggleActive,
  onDelete,
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
      <div
        className={`hidden ${GRID_COLS} gap-4 border-b border-hairline py-3 text-xs text-tertiary lg:grid`}
      >
        <div>ID</div>
        <div className={CELL_RULE}>名称</div>
        <div className={CELL_RULE}>类型</div>
        <div className={CELL_RULE}>状态</div>
        <div className={CELL_RULE}>回调地址</div>
        <div className={CELL_RULE}>Scope</div>
        <div className={`text-right ${CELL_RULE}`} aria-hidden />
      </div>
      {clients.map((client) => {
        const isInternal = client.client_id === "sast-link-web";
        return (
          <div
            key={client.id}
            className={`grid grid-cols-2 gap-x-4 gap-y-2 border-b border-hairline py-4 text-sm ${GRID_COLS_LG} lg:items-center lg:gap-4`}
          >
            <div
              className={`${CELL_ORDER(2)} admin-cell-label-lg text-tertiary`}
              data-label="ID"
            >
              #{client.id}
            </div>
            <div
              className={`order-first lg:order-none ${CELL_SPAN_FULL} admin-cell-label-lg truncate font-medium lg:min-w-0`}
              data-label="名称"
              title={client.client_name}
            >
              {client.client_name}
            </div>
            <div
              className={`${CELL_ORDER(3)} admin-cell-label-lg text-tertiary`}
              data-label="类型"
            >
              {CLIENT_TYPE_LABELS[client.client_type]}
            </div>
            <div className={`${CELL_ORDER(4)} ${CELL_SPAN_FULL} admin-cell-label-lg`} data-label="状态">
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
              className={`${CELL_ORDER(5)} ${CELL_SPAN_FULL} admin-cell-label-lg truncate text-tertiary lg:min-w-0`}
              data-label="回调地址"
              title={client.redirect_uris.join("、")}
            >
              {client.redirect_uris.join("、")}
            </div>
            <div
              className={`${CELL_ORDER(6)} ${CELL_SPAN_FULL} admin-cell-label-lg lg:min-w-0`}
              data-label="Scope"
            >
              <div className="flex flex-wrap gap-1.5">
                {client.scopes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-md border border-hairline bg-card px-2 py-1 text-xs text-tertiary"
                  >
                    {formatScope(s)}
                  </span>
                ))}
              </div>
            </div>
            <div
              className={`${CELL_ORDER(7)} ${CELL_SPAN_FULL} flex items-center justify-end gap-1.5 whitespace-nowrap`}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(client)}
                disabled={loading}
              >
                详细
              </Button>
              <Button
                variant="outline"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(client)}
                disabled={loading || isInternal}
                className="text-destructive hover:text-destructive"
                title={isInternal ? "内置客户端不可删除" : undefined}
              >
                删除
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
