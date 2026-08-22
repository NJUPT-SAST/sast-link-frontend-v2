"use client";

import Link from "next/link";
import useSWR from "swr";
import { Activity, KeyRound, Users } from "lucide-react";

import { getAdminStats } from "@/lib/api/admin";
import { ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { AdminErrorState } from "@/components/admin/error-state";
import { DotLoading } from "@/components/ui/dot-loading";
import {
  foldIncompleteCounts,
  INCOMPLETE_BUCKET_KEY,
  INCOMPLETE_BUCKET_LABEL,
} from "@/lib/admin/stats-incomplete";

// A restrained categorical palette that reads on both light and dark.
const PALETTE = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#f87171",
  "#4ade80",
  "#facc15",
];

function pickLabel(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}

// The folded incomplete bucket is a synthetic key, not a backend enum value, so
// both donuts extend their enum label map with it rather than relying on
// pickLabel's passthrough.
const ROLE_DONUT_LABELS = {
  ...ROLE_LABELS,
  [INCOMPLETE_BUCKET_KEY]: INCOMPLETE_BUCKET_LABEL,
};
const STATE_DONUT_LABELS = {
  ...STATE_LABELS,
  [INCOMPLETE_BUCKET_KEY]: INCOMPLETE_BUCKET_LABEL,
};

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-hairline bg-card p-5 transition-colors hover:bg-recessed"
    >
      <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="type-tech text-xs text-tertiary">{label}</div>
        <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </Link>
  );
}

/** Ring donut with a matching legend. */
function Donut({
  title,
  items,
  labelMap,
}: {
  title: string;
  items: [string, number][];
  labelMap: Record<string, string>;
}) {
  const sorted = [...items].sort((a, b) => b[1] - a[1]);
  // The denominator is the donut's own segment sum rather than the account
  // total: by_state spans every state (is_deleted included) while total counts
  // live accounts only, so sharing total would push that ring past 100% and
  // wrap the arc back over itself.
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  const r = 40;
  const circumference = 2 * Math.PI * r;

  return (
    <section className="rounded-xl border border-hairline bg-card p-5">
      <h3 className="type-tech mb-4 text-xs text-tertiary">{title}</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无数据</p>
      ) : (
        <div className="flex items-center gap-6">
          <svg viewBox="0 0 100 100" className="size-28 shrink-0">
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="12"
            />
            {(() => {
              let offset = 0;
              return sorted.map(([key, count], index) => {
                const frac = total > 0 ? count / total : 0;
                const dash = frac * circumference;
                const segment = (
                  <circle
                    key={key}
                    cx="50"
                    cy="50"
                    r={r}
                    fill="none"
                    stroke={PALETTE[index % PALETTE.length]}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 50 50)"
                  />
                );
                offset += dash;
                return segment;
              });
            })()}
          </svg>
          <div className="flex min-w-0 flex-col gap-2">
            {sorted.map(([key, count], index) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: PALETTE[index % PALETTE.length] }}
                />
                <span className="truncate text-muted-foreground">
                  {pickLabel(labelMap, key)}
                </span>
                <span className="ml-auto tabular-nums text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading, error, mutate } = useSWR(
    "admin:stats",
    () => getAdminStats().then((r) => r.data.data),
    { refreshInterval: 60000 },
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="type-title2">概览</h1>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      )}

      {error && <AdminErrorState onRetry={() => mutate()} />}

      {!isLoading && !error && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={<Users className="size-5" />} label="总用户" value={data.users.total} href="/admin/users" />
            <StatCard
              icon={<KeyRound className="size-5" />}
              label="OAuth 客户端"
              value={data.clients.total}
              sub={`激活 ${data.clients.active}`}
              href="/admin/oauth-clients"
            />
            <StatCard
              icon={<Activity className="size-5" />}
              label="近期操作"
              value={data.audit.recent.length}
              href="/admin/audit-logs"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Donut
              title="角色分布"
              items={foldIncompleteCounts(
                Object.entries(data.users.by_role),
                data.users.incomplete_by_role,
              )}
              labelMap={ROLE_DONUT_LABELS}
            />
            <Donut
              title="状态分布"
              items={foldIncompleteCounts(
                Object.entries(data.users.by_state),
                data.users.incomplete_by_state,
              )}
              labelMap={STATE_DONUT_LABELS}
            />
            <Donut
              title="部门分布"
              items={(() => {
                const items = Object.entries(data.users.by_department);
                if (data.users.no_department > 0) {
                  items.push(["未分配", data.users.no_department]);
                }
                return items;
              })()}
              labelMap={DEPARTMENT_LABELS}
            />
          </div>
        </>
      )}
    </div>
  );
}
