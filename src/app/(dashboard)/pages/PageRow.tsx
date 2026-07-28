"use client";

import { useState } from "react";
import Link from "next/link";
import type { PageSnapshot, SourcePage } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { HashChip } from "@/components/HashChip";

export function PageRow({
  page,
  snapshots,
  mismatched,
}: {
  page: SourcePage;
  snapshots: PageSnapshot[];
  mismatched: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-neutral-900/60"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-4 py-3 text-neutral-500">
          <span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
        </td>
        <td className="max-w-xs px-4 py-3">
          <a
            href={page.source_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="truncate text-blue-400 hover:underline"
          >
            {page.source_url}
          </a>
        </td>
        <td className="px-4 py-3 text-neutral-300">{page.target_slug ?? "—"}</td>
        <td className="px-4 py-3">
          <StatusBadge status={page.sync_status} />
        </td>
        <td className="px-4 py-3">
          <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5">
            <HashChip value={page.current_hash} />
            {mismatched && (
              <span
                title="current_hash does not match the most recent page_snapshots row — inconsistent, worth reporting"
                className="text-amber-400"
              >
                ⚠
              </span>
            )}
          </span>
        </td>
        <td className="px-4 py-3 text-neutral-400">{formatDateTime(page.last_checked_at)}</td>
        <td className="px-4 py-3 text-neutral-400">{formatDateTime(page.last_changed_at)}</td>
        <td className="px-4 py-3 text-neutral-400">{formatDateTime(page.last_synced_at)}</td>
      </tr>
      {open && (
        <tr className="bg-neutral-950/60">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Page details
                </h3>
                <dl className="space-y-1.5 text-sm">
                  <Row label="Locale" value={page.locale} />
                  <Row label="Target collection" value={page.target_collection} />
                  <Row label="Payload document ID" value={page.payload_document_id ?? "—"} />
                  <Row label="Enabled" value={page.enabled ? "Yes" : "No"} />
                </dl>
                {page.metadata && Object.keys(page.metadata).length > 0 && (
                  <>
                    <h3 className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Metadata
                    </h3>
                    <pre className="overflow-x-auto rounded-lg border border-neutral-800/70 bg-neutral-950 p-3 text-xs text-neutral-300">
                      {JSON.stringify(page.metadata, null, 2)}
                    </pre>
                  </>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/history?source_page_id=${page.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-400 hover:underline"
                  >
                    View change history →
                  </Link>
                  <Link
                    href={`/section-mapping?page=${page.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-400 hover:underline"
                  >
                    View section mapping →
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Snapshot history {snapshots.length > 0 && `(latest ${snapshots.length})`}
                </h3>
                {snapshots.length === 0 ? (
                  <p className="text-sm text-neutral-500">No snapshots recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-neutral-800/70">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900 text-neutral-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Hash</th>
                          <th className="px-3 py-2 font-medium">Captured</th>
                          <th className="px-3 py-2 font-medium">Run</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {snapshots.map((snap) => (
                          <tr key={snap.id}>
                            <td className="px-3 py-2">
                              <HashChip value={snap.page_hash} />
                            </td>
                            <td className="px-3 py-2 text-neutral-400">
                              {formatDateTime(snap.created_at)}
                            </td>
                            <td className="px-3 py-2 text-neutral-400">
                              <Link
                                href={`/runs/${snap.sync_run_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-400 hover:underline"
                              >
                                #{snap.sync_run_id}
                              </Link>
                              {snap.mode && <span className="text-neutral-600"> · {snap.mode}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="truncate text-neutral-200">{value}</dd>
    </div>
  );
}
