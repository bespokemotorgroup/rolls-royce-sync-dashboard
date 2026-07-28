import { query } from "@/lib/db";
import type { FieldMapping } from "@/lib/types";
import { PageGroup } from "./PageGroup";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

async function getPendingMappings() {
  return query<FieldMapping>(
    `SELECT fm.*, sp.source_url, sp.target_slug, sp.target_collection
     FROM field_mappings fm
     JOIN source_pages sp ON sp.id = fm.source_page_id
     WHERE fm.status = 'pending'
     ORDER BY sp.source_url, fm.source_key`,
  );
}

export default async function MappingsPage() {
  const mappings = await getPendingMappings();

  const groups = new Map<string, FieldMapping[]>();
  for (const mapping of mappings) {
    const key = mapping.source_page_id;
    const list = groups.get(key) ?? [];
    list.push(mapping);
    groups.set(key, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending mappings"
        description={
          <>
            {mappings.length} mapping{mappings.length === 1 ? "" : "s"} awaiting review, grouped by page.
            These decide where scraped fields land in Payload — separate from content-change approval.
          </>
        }
      />

      {groups.size === 0 && (
        <p className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-500">
          Nothing pending review. 🎉
        </p>
      )}

      <div className="space-y-6">
        {Array.from(groups.entries()).map(([sourcePageId, group]) => (
          <PageGroup
            key={sourcePageId}
            sourceUrl={group[0].source_url ?? "unknown"}
            targetSlug={group[0].target_slug}
            targetCollection={group[0].target_collection}
            mappings={group}
          />
        ))}
      </div>
    </div>
  );
}
