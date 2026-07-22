import Link from "next/link";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import type { SyncRun } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

async function getRun(id: string) {
  return queryOne<SyncRun>(`SELECT * FROM sync_runs WHERE id = $1`, [id]);
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();

  const errors = run.summary?.errors ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/runs" className="text-sm text-blue-400 hover:underline">
          ← All runs
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-neutral-100">
          Run #{run.id}
        </h1>
      </div>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Status" value={<StatusBadge status={run.status} />} />
          <Field label="Mode" value={run.mode} />
          <Field label="Trigger" value={run.trigger} />
          <Field label="Dry run" value={run.dry_run ? "Yes" : "No"} />
          <Field label="Started" value={formatDateTime(run.started_at)} />
          <Field label="Completed" value={formatDateTime(run.completed_at)} />
        </div>
      </section>

      {run.summary && (
        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-neutral-300">Summary</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {Object.entries(run.summary)
              .filter(([key]) => key !== "errors")
              .map(([key, value]) => (
                <Field key={key} label={key} value={String(value ?? 0)} />
              ))}
          </div>
        </section>
      )}

      {run.error && (
        <section className="rounded-lg border border-red-900/50 bg-red-950/30 p-6">
          <h2 className="mb-2 text-sm font-medium text-red-400">Run error</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-red-300">{run.error}</pre>
        </section>
      )}

      {Array.isArray(errors) && errors.length > 0 && (
        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-neutral-300">
            Errors ({errors.length})
          </h2>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-neutral-950 p-4 text-xs text-neutral-300">
            {JSON.stringify(errors, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-1 text-sm font-medium capitalize text-neutral-100">{value}</div>
    </div>
  );
}
