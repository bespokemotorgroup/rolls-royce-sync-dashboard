import { query } from "@/lib/db";
import type { ChangeEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { DiffFieldView } from "@/components/DiffFieldView";
import { ReviewCard } from "./ReviewCard";

export const dynamic = "force-dynamic";

async function getQueue() {
  return query<ChangeEvent>(
    `SELECT ce.*, sp.source_url, sp.target_slug, sp.target_collection
     FROM change_events ce
     JOIN source_pages sp ON sp.id = ce.source_page_id
     WHERE ce.status IN ('pending_review', 'superseded')
     ORDER BY sp.source_url, ce.created_at DESC`,
  );
}

export default async function ReviewPage() {
  const rows = await getQueue();

  const groups = new Map<string, ChangeEvent[]>();
  for (const row of rows) {
    const list = groups.get(row.source_page_id) ?? [];
    list.push(row);
    groups.set(row.source_page_id, list);
  }

  const pendingCount = rows.filter((r) => r.status === "pending_review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Review queue</h1>
        <p className="text-sm text-neutral-500">
          {pendingCount} change{pendingCount === 1 ? "" : "s"} awaiting review, grouped by page.
        </p>
      </div>

      {groups.size === 0 && <p className="text-sm text-neutral-500">Nothing pending review. 🎉</p>}

      <div className="space-y-8">
        {Array.from(groups.entries()).map(([sourcePageId, group]) => {
          const pending = group.filter((r) => r.status === "pending_review");
          const superseded = group.filter((r) => r.status === "superseded");
          const first = group[0];
          return (
            <div key={sourcePageId} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-800 pb-2">
                <a
                  href={first.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-blue-400 hover:underline"
                >
                  {first.source_url}
                </a>
                <p className="text-xs text-neutral-500">
                  {first.target_collection ?? "?"} / {first.target_slug ?? "unmapped"}
                </p>
              </div>

              {pending.map((change) => (
                <ReviewCard key={change.id} change={change} />
              ))}

              {superseded.map((change) => (
                <section
                  key={change.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 opacity-60"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-neutral-500">
                      Outdated — see newer version above · {formatDateTime(change.created_at)}
                    </p>
                    <StatusBadge status={change.status} />
                  </div>
                  <div className="mt-3 space-y-2">
                    {(change.review_diff?.fields ?? change.diff?.fields ?? []).map((field, i) => (
                      <DiffFieldView key={field.sourceKey + i} field={field} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
