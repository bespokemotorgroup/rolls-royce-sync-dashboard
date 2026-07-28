import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import type { SyncRun } from "@/lib/types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

async function getLatestRun() {
  return queryOne<SyncRun>(
    `SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 1`,
  );
}

async function getPendingCounts() {
  return query<{ mapping_kind: string; count: string }>(
    `SELECT mapping_kind, COUNT(*)::text AS count
     FROM field_mappings
     WHERE status = 'pending'
     GROUP BY mapping_kind`,
  );
}

async function getPendingReviewCount() {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM change_events WHERE status = 'pending_review'`,
  );
  return Number(row?.count ?? 0);
}

async function getRecentFailures() {
  return query<{ id: string; started_at: string; status: string; mode: string; error: string | null }>(
    `SELECT id, started_at, status, mode, error
     FROM sync_runs
     WHERE status IN ('failed', 'completed_with_errors')
     ORDER BY started_at DESC
     LIMIT 5`,
  );
}

export default async function OverviewPage() {
  const [latestRun, pendingCounts, pendingReviewCount, recentFailures] = await Promise.all([
    getLatestRun(),
    getPendingCounts(),
    getPendingReviewCount(),
    getRecentFailures(),
  ]);

  const totalPending = pendingCounts.reduce((sum, row) => sum + Number(row.count), 0);
  const needsAction = pendingReviewCount > 0 || totalPending > 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" description="Latest sync activity and review queue at a glance." />

      {needsAction && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-5 py-4">
          <p className="text-sm text-amber-200">
            <span className="font-semibold">Action needed:</span>{" "}
            {pendingReviewCount > 0 && (
              <>
                {pendingReviewCount} content change{pendingReviewCount === 1 ? "" : "s"} awaiting approval
              </>
            )}
            {pendingReviewCount > 0 && totalPending > 0 && " and "}
            {totalPending > 0 && (
              <>
                {totalPending} field mapping{totalPending === 1 ? "" : "s"} awaiting review
              </>
            )}
            .
          </p>
          <div className="flex gap-2">
            {pendingReviewCount > 0 && (
              <Link
                href="/review"
                className="rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/25"
              >
                Go to review queue →
              </Link>
            )}
            {totalPending > 0 && (
              <Link
                href="/mappings"
                className="rounded-md border border-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300/80 transition hover:bg-amber-500/10"
              >
                Go to mappings →
              </Link>
            )}
          </div>
        </div>
      )}

      <section className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900 p-6">
        <h2 className="mb-4 text-sm font-medium text-neutral-300">Most recent sync run</h2>
        {latestRun ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Status" value={<StatusBadge status={latestRun.status} />} />
            <Stat label="Mode" value={latestRun.mode} />
            <Stat label="Dry run" value={latestRun.dry_run ? "Yes" : "No"} />
            <Stat label="Started" value={formatRelative(latestRun.started_at)} title={formatDateTime(latestRun.started_at)} />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No sync runs recorded yet.</p>
        )}
        {latestRun?.summary && (
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4 sm:grid-cols-4 lg:grid-cols-8">
            {Object.entries(latestRun.summary)
              .filter(([key]) => key !== "errors")
              .map(([key, value]) => (
                <Stat key={key} label={key} value={String(value ?? 0)} />
              ))}
          </div>
        )}
        <div className="mt-4">
          <Link href="/runs" className="text-sm text-blue-400 hover:underline">
            View all runs →
          </Link>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <SummaryCard
          title="Changes awaiting review"
          count={pendingReviewCount}
          accent={pendingReviewCount > 0}
          href="/review"
          linkLabel="Review queue"
        >
          {pendingReviewCount > 0 ? (
            <p className="text-sm text-neutral-400">
              {pendingReviewCount} content change{pendingReviewCount === 1 ? "" : "s"} detected on the
              official site {pendingReviewCount === 1 ? "is" : "are"} waiting for approval.
            </p>
          ) : (
            <p className="text-sm text-neutral-500">Nothing pending review.</p>
          )}
        </SummaryCard>

        <SummaryCard
          title="Pending mappings"
          count={totalPending}
          accent={totalPending > 0}
          href="/mappings"
          linkLabel="Review queue"
        >
          {pendingCounts.length > 0 ? (
            <ul className="space-y-2">
              {pendingCounts.map((row) => (
                <li key={row.mapping_kind} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-neutral-400">{row.mapping_kind}</span>
                  <span className="font-medium text-neutral-100">{row.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Nothing pending review.</p>
          )}
        </SummaryCard>

        <section className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900 p-6 md:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-neutral-300">Recent failures</h2>
          {recentFailures.length > 0 ? (
            <ul className="divide-y divide-neutral-800">
              {recentFailures.map((run) => (
                <li key={run.id} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <span className="text-neutral-300 capitalize">{run.mode} run</span>
                    <p className="text-xs text-neutral-500">{formatDateTime(run.started_at)}</p>
                    {run.error && <p className="mt-1 truncate text-xs text-red-400">{run.error}</p>}
                  </div>
                  <StatusBadge status={run.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">No recent failures.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  count,
  accent,
  href,
  linkLabel,
  children,
}: {
  title: string;
  count: number;
  accent: boolean;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-lg border p-6 ${
        accent ? "border-amber-500/30 bg-amber-500/[0.04]" : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <h2 className="mb-4 text-sm font-medium text-neutral-300">
        {title} ({count})
      </h2>
      {children}
      <div className="mt-4">
        <Link href={href} className="text-sm text-blue-400 hover:underline">
          {linkLabel} →
        </Link>
      </div>
    </section>
  );
}

function Stat({ label, value, title }: { label: string; value: React.ReactNode; title?: string }) {
  return (
    <div title={title}>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-neutral-100">{value}</div>
    </div>
  );
}
