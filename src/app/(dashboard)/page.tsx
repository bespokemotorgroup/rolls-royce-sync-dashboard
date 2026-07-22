import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import type { SyncRun } from "@/lib/types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

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
  const [latestRun, pendingCounts, recentFailures] = await Promise.all([
    getLatestRun(),
    getPendingCounts(),
    getRecentFailures(),
  ]);

  const totalPending = pendingCounts.reduce((sum, row) => sum + Number(row.count), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Overview</h1>
        <p className="text-sm text-neutral-500">Latest sync activity and review queue at a glance.</p>
      </div>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
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
        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-neutral-300">
            Pending mappings ({totalPending})
          </h2>
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
          <div className="mt-4">
            <Link href="/mappings" className="text-sm text-blue-400 hover:underline">
              Review queue →
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-neutral-300">Recent failures</h2>
          {recentFailures.length > 0 ? (
            <ul className="space-y-3">
              {recentFailures.map((run) => (
                <li key={run.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">{run.mode} run</span>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="text-xs text-neutral-500">{formatDateTime(run.started_at)}</p>
                  {run.error && <p className="mt-1 truncate text-xs text-red-400">{run.error}</p>}
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

function Stat({ label, value, title }: { label: string; value: React.ReactNode; title?: string }) {
  return (
    <div title={title}>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-neutral-100">{value}</div>
    </div>
  );
}
