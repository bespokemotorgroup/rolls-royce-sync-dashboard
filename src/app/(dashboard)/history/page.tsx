import { query } from "@/lib/db";
import type { ChangeEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { DiffFieldView } from "@/components/DiffFieldView";

export const dynamic = "force-dynamic";

async function getHistory() {
  return query<ChangeEvent>(
    `SELECT ce.*, sp.source_url, sp.target_slug, sp.target_collection
     FROM change_events ce
     JOIN source_pages sp ON sp.id = ce.source_page_id
     WHERE ce.status IN ('published', 'rejected', 'superseded', 'requires_mapping', 'draft_updated')
     ORDER BY ce.updated_at DESC
     LIMIT 200`,
  );
}

export default async function HistoryPage() {
  const changes = await getHistory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">History</h1>
        <p className="text-sm text-neutral-500">
          What actually happened to reviewed changes — most recent 200, newest first.
        </p>
      </div>

      {changes.length === 0 && <p className="text-sm text-neutral-500">Nothing here yet.</p>}

      <div className="space-y-4">
        {changes.map((change) => {
          const blocked = change.payload_result?.blocked ?? [];
          const fields = change.review_diff?.fields ?? change.diff?.fields ?? [];
          return (
            <section
              key={change.id}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
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
                    {change.target_collection ?? "?"} / {change.target_slug ?? "unmapped"} ·
                    updated {formatDateTime(change.updated_at)}
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

              <div className="mt-3 space-y-2">
                {fields.map((field, i) => (
                  <DiffFieldView key={field.sourceKey + i} field={field} />
                ))}
              </div>

              {change.error && <p className="mt-3 text-xs text-red-400">{change.error}</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
