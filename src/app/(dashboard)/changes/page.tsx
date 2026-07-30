import Link from "next/link";
import { query } from "@/lib/db";
import type { ChangeEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { DiffFieldView } from "@/components/DiffFieldView";

export const dynamic = "force-dynamic";

async function getChanges(syncRunId?: string) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (syncRunId) {
    values.push(syncRunId);
    conditions.push(`ce.sync_run_id = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return query<ChangeEvent>(
    `SELECT ce.*, sp.source_url, sp.target_slug
     FROM change_events ce
     JOIN source_pages sp ON sp.id = ce.source_page_id
     ${where}
     ORDER BY ce.created_at DESC
     LIMIT ${syncRunId ? 500 : 100}`,
    values,
  );
}

export default async function ChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ sync_run_id?: string }>;
}) {
  const { sync_run_id } = await searchParams;
  const changes = await getChanges(sync_run_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recent changes"
        description={
          sync_run_id
            ? `Changes detected during sync run #${sync_run_id}, newest first.`
            : "Most recent 100 detected changes, newest first, across every status. For changes still needing a decision, use the Review Queue."
        }
        action={
          sync_run_id && (
            <div className="flex items-center gap-3">
              <Link href={`/runs/${sync_run_id}`} className="text-sm text-blue-400 hover:underline">
                ← Back to run #{sync_run_id}
              </Link>
              <Link href="/changes" className="text-sm text-blue-400 hover:underline">
                Clear filter ×
              </Link>
            </div>
          )
        }
      />

      {changes.length === 0 && (
        <p className="rounded-xl border border-neutral-800/80 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-500 shadow-sm shadow-black/20">
          {sync_run_id ? "No changes recorded for this run." : "No changes recorded yet."}
        </p>
      )}

      <div className="space-y-4">
        {changes.map((change) => {
          const blocked = change.payload_result?.blocked ?? [];
          const fields = change.review_diff?.fields ?? change.diff?.fields ?? [];
          return (
            <section
              key={change.id}
              className="rounded-xl border border-neutral-800/80 bg-neutral-900 p-4 shadow-sm shadow-black/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <a
                    href={change.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-400 hover:underline"
                  >
                    {change.source_url}
                  </a>
                  <p className="text-xs text-neutral-500">
                    {change.target_slug ?? "unmapped"} · {formatDateTime(change.created_at)} ·{" "}
                    <Link
                      href={`/changes?sync_run_id=${change.sync_run_id}`}
                      className="text-blue-400 hover:underline"
                    >
                      run #{change.sync_run_id}
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {blocked.length > 0 && (
                    <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-400">
                      blocked ({blocked.length})
                    </span>
                  )}
                  <StatusBadge status={change.status} />
                </div>
              </div>

              {fields.length > 0 && (
                <div className="mt-3 space-y-2">
                  {fields.map((field, i) => (
                    <DiffFieldView key={field.sourceKey + i} field={field} />
                  ))}
                </div>
              )}

              {change.error && (
                <p className="mt-3 text-xs text-red-400">{change.error}</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
