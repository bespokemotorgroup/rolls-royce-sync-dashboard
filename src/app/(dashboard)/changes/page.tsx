import { query } from "@/lib/db";
import type { ChangeEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

async function getRecentChanges() {
  return query<ChangeEvent>(
    `SELECT ce.*, sp.source_url, sp.target_slug
     FROM change_events ce
     JOIN source_pages sp ON sp.id = ce.source_page_id
     ORDER BY ce.created_at DESC
     LIMIT 100`,
  );
}

export default async function ChangesPage() {
  const changes = await getRecentChanges();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Recent changes</h1>
        <p className="text-sm text-neutral-500">Most recent 100 detected changes, newest first.</p>
      </div>

      {changes.length === 0 && (
        <p className="text-sm text-neutral-500">No changes recorded yet.</p>
      )}

      <div className="space-y-4">
        {changes.map((change) => {
          const blocked = change.payload_result?.blocked ?? [];
          const fields = change.diff?.fields ?? [];
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
                    {change.target_slug ?? "unmapped"} · {formatDateTime(change.created_at)}
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
                <div className="mt-3 overflow-x-auto rounded-md border border-neutral-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-950 text-neutral-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Field</th>
                        <th className="px-3 py-2 font-medium">Kind</th>
                        <th className="px-3 py-2 font-medium">Previous</th>
                        <th className="px-3 py-2 font-medium">Current</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {fields.map((field, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-neutral-400">{field.sourceKey}</td>
                          <td className="px-3 py-2 text-neutral-500">{field.kind}</td>
                          <td className="max-w-xs truncate px-3 py-2 text-neutral-500">
                            {stringify(field.previous)}
                          </td>
                          <td className="max-w-xs truncate px-3 py-2 text-neutral-200">
                            {stringify(field.current)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
