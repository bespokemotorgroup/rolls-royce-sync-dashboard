import { query } from "@/lib/db";
import type { ChangeEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { DiffFieldView } from "@/components/DiffFieldView";
import { PageHeader } from "@/components/PageHeader";
import { retryPublish } from "../review/actions";

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
            Approval publishes immediately through Payload. Items remain here only when publishing
            failed; use Retry publish after correcting the displayed error.
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
                {change.error && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-900/70 bg-red-950/40 px-3 py-2">
                    <p className="text-xs text-red-300">Publish failed: {change.error}</p>
                    <form action={retryPublish.bind(null, change.id)}>
                      <button className="rounded-md bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/25">
                        Retry publish
                      </button>
                    </form>
                  </div>
                )}
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
