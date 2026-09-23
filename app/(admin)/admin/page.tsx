"use client";

import Link from "next/link";
import useSWR from "swr";
import { Activity, KeyRound, Users } from "lucide-react";

import { getAdminStats, getAdminUsers } from "@/lib/api/admin";
import { ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { AdminErrorState } from "@/components/admin/error-state";
import { DotLoading } from "@/components/ui/dot-loading";
import {
  foldIncompleteCounts,
  INCOMPLETE_BUCKET_KEY,
  INCOMPLETE_BUCKET_LABEL,
} from "@/lib/admin/stats-incomplete";
import { computeGradeDistribution } from "@/lib/admin/stats-grade";
import type { UserProfileData } from "@/lib/api/types";

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

// 未补全 is bookkeeping, not a category the admin browses, and it is usually
// the largest slice — palette slot 0's saturated blue outshouted the real
// roles/states. A quiet slate reads on both light and dark.
const INCOMPLETE_SLICE_COLOR = "#94a3b8";

// 部门分布 is retired from the overview in favour of 年级分布. The donut and
// its data plumbing stay wired behind this flag so flipping it restores the
// card without reconstructing the call site.
const SHOW_DEPARTMENT_DONUT = false;

// /admin/stats carries no grade dimension, so the overview pages through the
// full user list and buckets login emails client-side. 100 is the backend's
// validate.MaxPageSize; the page cap bounds the loop against a lying total.
const GRADE_PAGE_SIZE = 100;
const GRADE_FETCH_PAGE_CAP = 50;

async function fetchGradeDistribution(): Promise<[string, number][]> {
  const users: Pick<UserProfileData, "login_email" | "state">[] = [];
  for (let page = 1; page <= GRADE_FETCH_PAGE_CAP; page++) {
    const { data } = await getAdminUsers({ page, page_size: GRADE_PAGE_SIZE });
    users.push(...data.data.users);
    if (users.length >= data.data.total || data.data.users.length === 0) break;
  }
  return computeGradeDistribution(users);
}

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
  // Palette assignment skips the muted incomplete slice, so the real buckets
  // keep stable colors wherever 未补全 lands after sorting.
  let paletteIndex = 0;
  const colors = sorted.map(([key]) =>
    key === INCOMPLETE_BUCKET_KEY
      ? INCOMPLETE_SLICE_COLOR
      : PALETTE[paletteIndex++ % PALETTE.length],
  );
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
                    stroke={colors[index]}
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
                  style={{ background: colors[index] }}
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
  // Grade buckets come from login emails, not /admin/stats, so this fetch
  // pages the whole user list once per mount; no 60s refresh — the roster
  // shifts far slower than the stats counters.
  const {
    data: gradeItems,
    isLoading: gradeLoading,
    error: gradeError,
  } = useSWR("admin:grade-distribution", fetchGradeDistribution, {
    revalidateOnFocus: false,
  });

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
            {SHOW_DEPARTMENT_DONUT ? (
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
            ) : gradeLoading ? (
              <section className="rounded-xl border border-hairline bg-card p-5">
                <h3 className="type-tech mb-4 text-xs text-tertiary">年级分布</h3>
                <div className="flex h-28 items-center justify-center">
                  <DotLoading />
                </div>
              </section>
            ) : gradeError ? null : (
              <Donut title="年级分布" items={gradeItems ?? []} labelMap={{}} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
