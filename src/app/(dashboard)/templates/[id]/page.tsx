import Link from "next/link";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import type { PageTemplate } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getTemplate(id: string) {
  return queryOne<PageTemplate>(`SELECT * FROM page_templates WHERE id = $1`, [id]);
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/templates" className="text-sm text-blue-400 hover:underline">
          ← All templates
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-neutral-100">
          {template.target_collection} / {template.target_slug}
        </h1>
        <p className="text-sm text-neutral-500">
          Last updated {formatDateTime(template.updated_at)}
        </p>
      </div>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-sm font-medium text-neutral-300">
          Block sequence ({template.block_sequence?.length ?? 0} blocks)
        </h2>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-neutral-950 p-4 text-xs text-neutral-300">
          {JSON.stringify(template.block_sequence, null, 2)}
        </pre>
      </section>
    </div>
  );
}
