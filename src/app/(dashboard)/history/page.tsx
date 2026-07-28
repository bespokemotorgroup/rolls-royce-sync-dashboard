import Link from "next/link";
import { query } from "@/lib/db";
import type { ChangeEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { DiffFieldView } from "@/components/DiffFieldView";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

async function getHistory(sourcePageId?: string) {
  const conditions = [
    `ce.status IN ('published', 'rejected', 'superseded', 'requires_mapping', 'draft_updated')`,
  ];
  const values: unknown[] = [];
  if (sourcePageId) {
    values.push(sourcePageId);
    conditions.push(`ce.source_page_id = $${values.length}`);
  }
  return query<ChangeEvent>(
    `SELECT ce.*, sp.source_url, sp.target_slug, sp.target_collection
     FROM change_events ce
     JOIN source_pages sp ON sp.id = ce.source_page_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY ce.updated_at DESC
     LIMIT 200`,
    values,
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ source_page_id?: string }>;
}) {
  const { source_page_id } = await searchParams;
  const changes = await getHistory(source_page_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="What actually happened to reviewed changes — published, rejected, superseded, or blocked. Most recent 200, newest first."
        action={
          source_page_id && (
            <Link
              href="/history"
              className="text-sm text-blue-400 hover:underline"
            >
              Clear filter (showing one page only) ×
            </Link>
          )
        }
      />

      {changes.length === 0 && (
        <p className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-500">
          Nothing here yet.
        </p>
      )}

      <div className="space-y-4">
        {changes.map((change) => {
          const blocked = change.payload_result?.blocked ?? [];
          const fields = change.review_diff?.fields ?? change.diff?.fields ?? [];
          return (
            <section
              key={change.id}
              className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900 p-4"
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
