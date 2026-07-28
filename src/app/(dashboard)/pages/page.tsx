import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import type { PageSnapshot, SourcePage } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { PageRow } from "./PageRow";

export const dynamic = "force-dynamic";

const SORTABLE: Record<string, string> = {
  source_url: "sp.source_url",
  last_checked_at: "sp.last_checked_at",
  last_changed_at: "sp.last_changed_at",
  last_synced_at: "sp.last_synced_at",
};

async function getStatusCounts() {
  return query<{ sync_status: string; count: string }>(
    `SELECT sync_status, COUNT(*)::text AS count FROM source_pages GROUP BY sync_status ORDER BY count DESC`,
  );
}

async function getCollections() {
  const rows = await query<{ target_collection: string }>(
    `SELECT DISTINCT target_collection FROM source_pages ORDER BY target_collection`,
  );
  return rows.map((r) => r.target_collection);
}

async function getIntegrityMismatchIds() {
  const rows = await query<{ id: string }>(
    `SELECT sp.id
     FROM source_pages sp
     JOIN page_snapshots ps ON ps.id = (
       SELECT MAX(id) FROM page_snapshots WHERE source_page_id = sp.id
     )
     WHERE ps.page_hash IS DISTINCT FROM sp.current_hash`,
  );
  return new Set(rows.map((r) => r.id));
}

async function getPages(params: {
  status?: string;
  collection?: string;
  integrity?: string;
  sort?: string;
  dir?: string;
  mismatchIds: Set<string>;
}) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.status) {
    values.push(params.status);
    conditions.push(`sp.sync_status = $${values.length}`);
  }
  if (params.collection) {
    values.push(params.collection);
    conditions.push(`sp.target_collection = $${values.length}`);
  }
  if (params.integrity === "1") {
    const ids = Array.from(params.mismatchIds);
    if (ids.length === 0) return [];
    values.push(ids);
    conditions.push(`sp.id = ANY($${values.length}::bigint[])`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortCol = SORTABLE[params.sort ?? ""] ?? "sp.last_checked_at";
  const dir = params.dir === "asc" ? "ASC" : "DESC";

  return query<SourcePage>(
    `SELECT sp.* FROM source_pages sp ${where} ORDER BY ${sortCol} ${dir} NULLS LAST`,
    values,
  );
}

async function getSnapshotsForPages(ids: string[]) {
  if (ids.length === 0) return new Map<string, PageSnapshot[]>();
  const rows = await query<PageSnapshot & { rn: string }>(
    `SELECT * FROM (
       SELECT ps.*, sr.trigger, sr.mode,
         ROW_NUMBER() OVER (PARTITION BY ps.source_page_id ORDER BY ps.id DESC) AS rn
       FROM page_snapshots ps
       LEFT JOIN sync_runs sr ON sr.id = ps.sync_run_id
       WHERE ps.source_page_id = ANY($1::bigint[])
     ) t
     WHERE rn <= 10
     ORDER BY source_page_id, id DESC`,
    [ids],
  );
  const map = new Map<string, PageSnapshot[]>();
  for (const row of rows) {
    const list = map.get(row.source_page_id) ?? [];
    list.push(row);
    map.set(row.source_page_id, list);
  }
  return map;
}

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; collection?: string; integrity?: string; sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const [statusCounts, collections, mismatchIds] = await Promise.all([
    getStatusCounts(),
    getCollections(),
    getIntegrityMismatchIds(),
  ]);

  const pages = await getPages({ ...params, mismatchIds });
  const snapshotsByPage = await getSnapshotsForPages(pages.map((p) => p.id));
  const total = statusCounts.reduce((sum, row) => sum + Number(row.count), 0);

  function filterHref(next: { status?: string; collection?: string; integrity?: string }) {
    const sp = new URLSearchParams();
    const status = "status" in next ? next.status : params.status;
    const collection = "collection" in next ? next.collection : params.collection;
    const integrity = "integrity" in next ? next.integrity : params.integrity;
    if (status) sp.set("status", status);
    if (collection) sp.set("collection", collection);
    if (integrity) sp.set("integrity", integrity);
    const qs = sp.toString();
    return `/pages${qs ? `?${qs}` : ""}`;
  }

  function sortHref(col: string) {
    const sp = new URLSearchParams();
    if (params.status) sp.set("status", params.status);
    if (params.collection) sp.set("collection", params.collection);
    if (params.integrity) sp.set("integrity", params.integrity);
    sp.set("sort", col);
    sp.set("dir", params.sort === col && params.dir !== "asc" ? "asc" : "desc");
    return `/pages?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Pages"
        description="Every URL the sync has ever discovered on the official site, and whether its recorded content hash is still consistent."
      />

      <div className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <FilterPill
            label={`All (${total})`}
            href={filterHref({ status: undefined })}
            active={!params.status}
          />
          {statusCounts.map((row) => (
            <FilterPill
              key={row.sync_status}
              label={`${row.sync_status.replace(/_/g, " ")} (${row.count})`}
              href={filterHref({ status: row.sync_status })}
              active={params.status === row.sync_status}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-800 pt-3 text-sm">
          <span className="text-xs uppercase tracking-wide text-neutral-500">Collection</span>
          <FilterPill
            label="All"
            href={filterHref({ collection: undefined })}
            active={!params.collection}
          />
          {collections.map((c) => (
            <FilterPill
              key={c}
              label={c}
              href={filterHref({ collection: c })}
              active={params.collection === c}
            />
          ))}
          <span className="ml-4 h-4 w-px bg-neutral-800" aria-hidden />
          <FilterPill
            label={`⚠ Integrity mismatches (${mismatchIds.size})`}
            href={filterHref({ integrity: params.integrity === "1" ? undefined : "1" })}
            active={params.integrity === "1"}
            tone={mismatchIds.size > 0 ? "amber" : undefined}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20">
        <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-10" />
            <col className="w-[26%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[16%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">
                <SortLink label="Source URL" col="source_url" href={sortHref("source_url")} active={params.sort === "source_url"} dir={params.dir} />
              </th>
              <th className="px-4 py-3 font-medium">Target slug</th>
              <th className="px-4 py-3 font-medium">Sync status</th>
              <th className="px-4 py-3 font-medium">Current vs. last synced hash</th>
              <th className="px-4 py-3 font-medium">
                <SortLink label="Last checked" col="last_checked_at" href={sortHref("last_checked_at")} active={params.sort === "last_checked_at" || !params.sort} dir={params.dir} />
              </th>
              <th className="px-4 py-3 font-medium">
                <SortLink label="Last changed" col="last_changed_at" href={sortHref("last_changed_at")} active={params.sort === "last_changed_at"} dir={params.dir} />
              </th>
              <th className="px-4 py-3 font-medium">
                <SortLink label="Last synced" col="last_synced_at" href={sortHref("last_synced_at")} active={params.sort === "last_synced_at"} dir={params.dir} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {pages.map((page) => (
              <PageRow
                key={page.id}
                page={page}
                snapshots={snapshotsByPage.get(page.id) ?? []}
                mismatched={mismatchIds.has(page.id)}
              />
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-500">
                  No pages match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  href,
  active,
  tone,
}: {
  label: string;
  href: string;
  active: boolean;
  tone?: "amber";
}) {
  const activeClass =
    tone === "amber"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-neutral-100 text-neutral-900 border-neutral-100";
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
        active
          ? activeClass
          : "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
      }`}
    >
      {label}
    </Link>
  );
}

function SortLink({
  label,
  href,
  active,
  dir,
}: {
  label: string;
  col: string;
  href: string;
  active: boolean;
  dir?: string;
}) {
  return (
    <Link href={href} className={`inline-flex items-center gap-1 hover:text-neutral-200 ${active ? "text-neutral-200" : ""}`}>
      {label}
      {active && <span>{dir === "asc" ? "↑" : "↓"}</span>}
    </Link>
  );
}
