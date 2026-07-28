import { query, queryOne } from "@/lib/db";
import type { FieldMapping, PageTemplate, SourcePage } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PageSelector } from "./PageSelector";

export const dynamic = "force-dynamic";

async function getPageOptions() {
  return query<Pick<SourcePage, "id" | "source_url" | "target_slug" | "target_collection">>(
    `SELECT id, source_url, target_slug, target_collection FROM source_pages ORDER BY source_url`,
  );
}

async function getSelectedPage(id: string) {
  return queryOne<SourcePage>(`SELECT * FROM source_pages WHERE id = $1`, [id]);
}

async function getMappings(sourcePageId: string) {
  return query<FieldMapping>(
    `SELECT * FROM field_mappings WHERE source_page_id = $1 ORDER BY mapping_kind, source_key`,
    [sourcePageId],
  );
}

async function getTemplate(targetCollection: string) {
  return queryOne<PageTemplate>(
    `SELECT * FROM page_templates WHERE target_collection = $1 ORDER BY updated_at DESC LIMIT 1`,
    [targetCollection],
  );
}

export default async function SectionMappingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageId } = await searchParams;
  const options = await getPageOptions();

  const [selectedPage, mappings] = pageId
    ? await Promise.all([getSelectedPage(pageId), getMappings(pageId)])
    : [null, []];

  const template = selectedPage ? await getTemplate(selectedPage.target_collection) : null;

  const groups = new Map<string, FieldMapping[]>();
  for (const m of mappings) {
    const list = groups.get(m.mapping_kind) ?? [];
    list.push(m);
    groups.set(m.mapping_kind, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Section mapping"
        description="Which official-site content maps to which Payload field, and the structural block template for that page's collection. Read-only — this is the map, not the change queue."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <PageSelector options={options} selectedId={selectedPage?.id} />

        {!selectedPage ? (
          <div className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 p-12 text-sm text-neutral-500">
            Select a page to view its mappings.
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <a
                href={selectedPage.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-blue-400 hover:underline"
              >
                {selectedPage.source_url}
              </a>
              <p className="text-xs text-neutral-500">
                {selectedPage.target_collection} / {selectedPage.target_slug ?? "unmapped"} ·{" "}
                {mappings.length} mapping{mappings.length === 1 ? "" : "s"}
              </p>
            </section>

            {mappings.length === 0 && (
              <p className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-500">
                No field mappings recorded for this page yet.
              </p>
            )}

            {Array.from(groups.entries()).map(([kind, group]) => (
              <section key={kind} className="rounded-lg border border-neutral-800 bg-neutral-900">
                <h2 className="border-b border-neutral-800 px-4 py-3 text-sm font-medium capitalize text-neutral-300">
                  {kind} ({group.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-950 text-neutral-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">Source key</th>
                        <th className="px-4 py-2 font-medium">Payload pointer</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">Confidence</th>
                        <th className="px-4 py-2 font-medium">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {group.map((m) => (
                        <tr key={m.id}>
                          <td className="px-4 py-2 text-neutral-400">
                            <code>{m.source_key}</code>
                          </td>
                          <td className="px-4 py-2 text-neutral-400">
                            <code>{m.payload_pointer}</code>
                          </td>
                          <td className="px-4 py-2">
                            <StatusBadge status={m.status} />
                          </td>
                          <td className="px-4 py-2 text-neutral-400">
                            {Number(m.confidence).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-neutral-300">
                            <MappingDetail mapping={m} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}

            <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-300">
                Template — {selectedPage.target_collection}
              </h2>
              {!template ? (
                <p className="text-sm text-neutral-500">
                  No template saved for this collection yet.
                </p>
              ) : (
                <div>
                  <p className="mb-3 text-xs text-neutral-500">
                    Captured from <span className="text-neutral-300">{template.target_slug}</span> ·
                    updated {formatDateTime(template.updated_at)} ·{" "}
                    {template.block_sequence?.length ?? 0} blocks
                  </p>
                  <div className="space-y-2">
                    {(template.block_sequence ?? []).map((block) => (
                      <div
                        key={block.index}
                        className="rounded-md border border-neutral-800 bg-neutral-950 p-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                            #{block.index}
                          </span>
                          <span className="text-sm font-medium text-neutral-200">
                            {block.blockType}
                          </span>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-neutral-400">
                          {JSON.stringify(block.settings, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function MappingDetail({ mapping }: { mapping: FieldMapping }) {
  const meta = mapping.metadata ?? {};

  switch (mapping.mapping_kind) {
    case "asset":
      return (
        <div className="flex items-center gap-2">
          {meta.sourceUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.sourceUrl}
              alt=""
              className="h-8 w-8 rounded border border-neutral-800 object-cover"
            />
          )}
          <span className="truncate">
            {meta.currentPayloadMediaId ? `media #${meta.currentPayloadMediaId}` : (meta.sourceUrl ?? "—")}
          </span>
        </div>
      );
    case "link":
      return (
        <span className="truncate">
          {meta.label ?? "(no label)"} <span className="text-neutral-600">→</span>{" "}
          <span className="text-blue-400">{meta.sourceHref ?? "—"}</span>
        </span>
      );
    case "background":
      return (
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 shrink-0 rounded border border-neutral-700"
            style={{ backgroundColor: meta.currentValue ?? meta.sourceColor ?? "transparent" }}
          />
          <span>{meta.currentValue ?? meta.sourceColor ?? "—"}</span>
        </div>
      );
    default:
      return <span className="truncate">{meta.baselineValue ?? "—"}</span>;
  }
}
