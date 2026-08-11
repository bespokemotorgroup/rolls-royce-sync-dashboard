import { query } from "@/lib/db";
import type { ChangeEvent } from "@/lib/types";
import { ReviewCard } from "./ReviewCard";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function getQueue() {
  return query<ChangeEvent>(
    `SELECT ce.*, sp.source_url, sp.target_slug, sp.target_collection
     FROM change_events ce
     JOIN source_pages sp ON sp.id = ce.source_page_id
     WHERE ce.status = 'pending_review'
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

  const pendingCount = rows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review queue"
        description={
          <>
            {pendingCount} change{pendingCount === 1 ? "" : "s"} detected on the official site,
            awaiting your approval before they publish. Approving the final field immediately
            updates the page through Payload.
          </>
        }
      />

      {groups.size === 0 && (
        <p className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-500">
          Nothing pending review. 🎉
        </p>
      )}

      <div className="space-y-8">
        {Array.from(groups.entries()).map(([sourcePageId, group]) => {
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

              {group.map((change) => (
                <ReviewCard key={change.id} change={change} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
