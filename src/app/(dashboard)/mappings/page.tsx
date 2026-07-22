import { query } from "@/lib/db";
import type { FieldMapping } from "@/lib/types";
import { PageGroup } from "./PageGroup";

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
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Pending mappings</h1>
        <p className="text-sm text-neutral-500">
          {mappings.length} mapping{mappings.length === 1 ? "" : "s"} awaiting review, grouped by page.
        </p>
      </div>

      {groups.size === 0 && (
        <p className="text-sm text-neutral-500">Nothing pending review. 🎉</p>
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
