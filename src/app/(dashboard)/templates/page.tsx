import Link from "next/link";
import { query } from "@/lib/db";
import type { PageTemplate } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getTemplates() {
  return query<PageTemplate>(
    `SELECT * FROM page_templates ORDER BY target_collection, target_slug`,
  );
}

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Page templates</h1>
        <p className="text-sm text-neutral-500">
          Saved block-structure stencils used to auto-populate new pages.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Collection</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Blocks</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-neutral-900/60">
                <td className="px-4 py-3 text-neutral-300">{template.target_collection}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/templates/${template.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    {template.target_slug}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  {template.block_sequence?.length ?? 0}
                </td>
                <td className="px-4 py-3 text-neutral-300">{formatDateTime(template.updated_at)}</td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  No templates saved yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
