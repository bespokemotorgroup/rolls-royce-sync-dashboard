"use client";

import { useState, useTransition } from "react";
import type { FieldMapping } from "@/lib/types";
import { setMappingStatus, setMappingStatusBulk } from "./actions";

export function PageGroup({
  sourceUrl,
  targetSlug,
  targetCollection,
  mappings,
}: {
  sourceUrl: string;
  targetSlug: string | null | undefined;
  targetCollection: string | undefined;
  mappings: FieldMapping[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const visible = mappings.filter((m) => !hidden.has(m.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === visible.length ? new Set() : new Set(visible.map((m) => m.id)),
    );
  }

  function act(id: string, status: "approved" | "rejected") {
    setHidden((prev) => new Set(prev).add(id));
    startTransition(() => {
      void setMappingStatus(id, status);
    });
  }

  function actBulk(status: "approved" | "rejected") {
    const ids = Array.from(selected);
    setHidden((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setSelected(new Set());
    startTransition(() => {
      void setMappingStatusBulk(ids, status);
    });
  }

  if (visible.length === 0) return null;

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3">
        <div>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-400 hover:underline"
          >
            {sourceUrl}
          </a>
          <p className="text-xs text-neutral-500">
            {targetCollection ?? "?"} / {targetSlug ?? "unmapped"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="text-xs text-neutral-400 hover:text-neutral-200"
            disabled={isPending}
          >
            {selected.size === visible.length ? "Deselect all" : "Select all"}
          </button>
          <button
            onClick={() => actBulk("approved")}
            disabled={selected.size === 0 || isPending}
            className="rounded-md bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 disabled:opacity-40"
          >
            Approve selected ({selected.size})
          </button>
          <button
            onClick={() => actBulk("rejected")}
            disabled={selected.size === 0 || isPending}
            className="rounded-md bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 disabled:opacity-40"
          >
            Reject selected
          </button>
        </div>
      </div>

      <ul className="divide-y divide-neutral-800">
        {visible.map((mapping) => (
          <li key={mapping.id} className="flex items-start gap-3 px-4 py-3">
            <input
              type="checkbox"
              checked={selected.has(mapping.id)}
              onChange={() => toggle(mapping.id)}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
                  {mapping.mapping_kind}
                </span>
                <code className="truncate text-xs text-neutral-500">{mapping.source_key}</code>
                <span className="text-xs text-neutral-600">→</span>
                <code className="truncate text-xs text-neutral-500">{mapping.payload_pointer}</code>
                <span className="ml-auto text-xs text-neutral-600">
                  conf {Number(mapping.confidence).toFixed(2)}
                </span>
              </div>
              <div className="mt-2">
                <MappingContent mapping={mapping} />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => act(mapping.id, "approved")}
                disabled={isPending}
                className="rounded-md bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 disabled:opacity-40"
              >
                Approve
              </button>
              <button
                onClick={() => act(mapping.id, "rejected")}
                disabled={isPending}
                className="rounded-md bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MappingContent({ mapping }: { mapping: FieldMapping }) {
  const metadata = mapping.metadata ?? {};

  if (mapping.mapping_kind === "asset" && metadata.sourceUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={metadata.sourceUrl}
        alt=""
        className="max-h-40 rounded-md border border-neutral-800 object-contain"
      />
    );
  }

  if (mapping.mapping_kind === "link") {
    return (
      <p className="text-sm text-neutral-300">
        <span className="text-neutral-500">{metadata.label ?? "(no label)"}</span>{" "}
        <span className="text-neutral-600">→</span>{" "}
        <span className="text-blue-400">{metadata.sourceHref ?? "—"}</span>
      </p>
    );
  }

  return (
    <p className="whitespace-pre-wrap text-sm text-neutral-300">
      {typeof metadata.baselineValue === "string" ? metadata.baselineValue : "—"}
    </p>
  );
}
