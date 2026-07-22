import Link from "next/link";
import { query } from "@/lib/db";
import type { SyncRun } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

async function getRuns() {
  return query<SyncRun>(
    `SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 100`,
  );
}

export default async function RunsPage() {
  const runs = await getRuns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Sync runs</h1>
        <p className="text-sm text-neutral-500">Most recent 100 runs, newest first.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Trigger</th>
              <th className="px-4 py-3 font-medium">Dry run</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Discovered</th>
              <th className="px-4 py-3 font-medium">Changed</th>
              <th className="px-4 py-3 font-medium">Failed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-neutral-900/60">
                <td className="px-4 py-3">
                  <Link href={`/runs/${run.id}`} className="text-blue-400 hover:underline">
                    {formatDateTime(run.started_at)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-300">{run.mode}</td>
                <td className="px-4 py-3 text-neutral-300">{run.trigger}</td>
                <td className="px-4 py-3 text-neutral-300">{run.dry_run ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-4 py-3 text-neutral-300">{run.summary?.discovered ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-300">{run.summary?.changed ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-300">{run.summary?.failed ?? "—"}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-500">
                  No sync runs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
