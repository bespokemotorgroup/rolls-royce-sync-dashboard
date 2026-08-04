import Link from "next/link";
import { query } from "@/lib/db";
import type { ChangeEvent, DiffField } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { DiffFieldView } from "@/components/DiffFieldView";

export const dynamic = "force-dynamic";

const KINDS: DiffField["kind"][] = ["text", "asset", "link", "background"];

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
  searchParams: Promise<{ sync_run_id?: string; kind?: string }>;
}) {
  const { sync_run_id, kind } = await searchParams;
  const changes = await getChanges(sync_run_id);

  function kindHref(nextKind: string | undefined) {
    const sp = new URLSearchParams();
    if (sync_run_id) sp.set("sync_run_id", sync_run_id);
    if (nextKind) sp.set("kind", nextKind);
    const qs = sp.toString();
    return `/changes${qs ? `?${qs}` : ""}`;
  }

  // Count fields by kind across the loaded set, for the filter pill counts.
  const kindCounts: Record<string, number> = {};
  for (const change of changes) {
    const fields = change.review_diff?.fields ?? change.diff?.fields ?? [];
    for (const field of fields) {
      kindCounts[field.kind] = (kindCounts[field.kind] ?? 0) + 1;
    }
  }
  const totalFields = Object.values(kindCounts).reduce((a, b) => a + b, 0);

  const visibleChanges = changes
    .map((change) => {
      const fields = change.review_diff?.fields ?? change.diff?.fields ?? [];
      const filteredFields = kind ? fields.filter((f) => f.kind === kind) : fields;
      return { change, fields: filteredFields };
    })
    .filter(({ change, fields }) => !kind || fields.length > 0 || !!change.error);

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
              <Link href={kindHref(kind)} className="text-sm text-blue-400 hover:underline">
                Clear run filter ×
              </Link>
            </div>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Content type</span>
        <FilterPill label={`All (${totalFields})`} href={kindHref(undefined)} active={!kind} />
        {KINDS.map((k) => (
          <FilterPill
            key={k}
            label={`${k} (${kindCounts[k] ?? 0})`}
            href={kindHref(k)}
            active={kind === k}
          />
        ))}
      </div>

      {visibleChanges.length === 0 && (
        <p className="rounded-xl border border-neutral-800/80 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-500 shadow-sm shadow-black/20">
          {kind ? `No ${kind} changes match this filter.` : sync_run_id ? "No changes recorded for this run." : "No changes recorded yet."}
        </p>
      )}

      <div className="space-y-4">
        {visibleChanges.map(({ change, fields }) => {
          const blocked = change.payload_result?.blocked ?? [];
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
                      href={`/changes?sync_run_id=${change.sync_run_id}${kind ? `&kind=${kind}` : ""}`}
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

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
        active
          ? "border-neutral-100 bg-neutral-100 text-neutral-900"
          : "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
      }`}
    >
      {label}
    </Link>
  );
}
