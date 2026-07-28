import { query } from "@/lib/db";
import type { ChangeEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { DiffFieldView } from "@/components/DiffFieldView";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

async function getApproved() {
  return query<ChangeEvent>(
    `SELECT ce.*, sp.source_url, sp.target_slug, sp.target_collection
     FROM change_events ce
     JOIN source_pages sp ON sp.id = ce.source_page_id
     WHERE ce.status = 'approved'
     ORDER BY ce.updated_at DESC`,
  );
}

export default async function ApprovedPage() {
  const changes = await getApproved();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approved, awaiting publish"
        description={
          <>
            Approved by a reviewer but not yet published — picked up on the next sync run (twice
            weekly, or a manual trigger). The sync service re-checks the official page first; if
            it changed again since approval, this moves to <em>superseded</em> instead of publishing.
          </>
        }
      />

      {changes.length === 0 && (
        <p className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-500">
          Nothing waiting to be published.
        </p>
      )}

      <div className="space-y-4">
        {changes.map((change) => {
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
                    approved {formatDateTime(change.updated_at)}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {fields.map((field, i) => (
                  <DiffFieldView key={field.sourceKey + i} field={field} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
