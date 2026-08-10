"use client";

import { useState, useTransition } from "react";
import type { ChangeEvent as ChangeEventRow, DiffAssetValue, DiffField, DiffLinkValue } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { approveChange, decideChangeField, rejectChange, saveReviewDiff } from "./actions";

export function ReviewCard({ change }: { change: ChangeEventRow }) {
  const originalFields = change.review_diff?.fields ?? change.diff?.fields ?? [];
  const [fields, setFields] = useState<DiffField[]>(originalFields);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>(
    change.review_diff?.decisions ?? {},
  );

  if (resolved) return null;

  function updateCurrent(index: number, value: unknown) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, current: value } : f)));
  }

  function save() {
    startTransition(async () => {
      const changed = JSON.stringify(fields) !== JSON.stringify(originalFields);
      if (changed) {
        await saveReviewDiff(change.id, {
          fields,
          sectionsAdded: change.diff?.sectionsAdded ?? [],
          sectionsRemoved: change.diff?.sectionsRemoved ?? [],
          decisions,
        });
      }
      setEditing(false);
    });
  }

  function approve() {
    startTransition(async () => {
      const result = await approveChange(change.id);
      if (result.resolved) setResolved(true);
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectChange(change.id);
      if (result.resolved) setResolved(true);
    });
  }

  function decideField(sourceKey: string, decision: "approved" | "rejected") {
    setDecisions((previous) => ({ ...previous, [sourceKey]: decision }));
    startTransition(async () => {
      const result = await decideChangeField(change.id, sourceKey, decision);
      if (result.resolved) setResolved(true);
    });
  }

  const decidedCount = fields.filter((field) => decisions[field.sourceKey]).length;

  return (
    <section className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">
          {formatDateTime(change.created_at)} · {decidedCount}/{fields.length} decided
        </p>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              disabled={isPending}
              className="rounded-md border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
            >
              Edit
            </button>
          )}
          {editing && (
            <button
              onClick={save}
              disabled={isPending}
              className="rounded-md bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 disabled:opacity-40"
            >
              Save
            </button>
          )}
          <button
            onClick={approve}
            disabled={isPending || editing}
            className="rounded-md bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 disabled:opacity-40"
          >
            Approve all
          </button>
          <button
            onClick={reject}
            disabled={isPending || editing}
            className="rounded-md bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 disabled:opacity-40"
          >
            Reject all
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {fields.map((field, i) => (
          <FieldRow
            key={field.sourceKey + i}
            field={field}
            editing={editing}
            decision={decisions[field.sourceKey]}
            disabled={isPending || editing}
            onDecision={(decision) => decideField(field.sourceKey, decision)}
            onChange={(value) => updateCurrent(i, value)}
          />
        ))}
        {fields.length === 0 && <p className="text-sm text-neutral-500">No field changes recorded.</p>}
      </div>
    </section>
  );
}

function FieldRow({
  field,
  editing,
  decision,
  disabled,
  onDecision,
  onChange,
}: {
  field: DiffField;
  editing: boolean;
  decision?: "approved" | "rejected";
  disabled: boolean;
  onDecision: (decision: "approved" | "rejected") => void;
  onChange: (value: unknown) => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-800/70 bg-neutral-950 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
          {field.kind}
        </span>
        <code className="truncate text-xs text-neutral-500">{field.sourceKey}</code>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={decision === "approved"}
            onClick={() => onDecision("approved")}
            className={`rounded px-2 py-1 text-[11px] font-medium disabled:opacity-40 ${
              decision === "approved"
                ? "bg-emerald-500 text-black"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            Approve
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={decision === "rejected"}
            onClick={() => onDecision("rejected")}
            className={`rounded px-2 py-1 text-[11px] font-medium disabled:opacity-40 ${
              decision === "rejected" ? "bg-red-500 text-white" : "bg-red-500/10 text-red-400"
            }`}
          >
            Reject
          </button>
        </div>
      </div>
      <FieldEditor field={field} editing={editing} onChange={onChange} />
    </div>
  );
}

function FieldEditor({
  field,
  editing,
  onChange,
}: {
  field: DiffField;
  editing: boolean;
  onChange: (value: unknown) => void;
}) {
  switch (field.kind) {
    case "background":
      return <BackgroundEditor field={field} editing={editing} onChange={onChange} />;
    case "asset":
      return <AssetEditor field={field} editing={editing} onChange={onChange} />;
    case "link":
      return <LinkEditor field={field} editing={editing} onChange={onChange} />;
    default:
      return <TextEditor field={field} editing={editing} onChange={onChange} />;
  }
}

function TextEditor({ field, editing, onChange }: { field: DiffField; editing: boolean; onChange: (v: unknown) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
      <div>
        <p className="mb-1 text-[10px] uppercase text-neutral-600">Previous</p>
        <p className="whitespace-pre-wrap text-neutral-500 line-through decoration-neutral-700">
          {stringify(field.previous)}
        </p>
      </div>
      <div>
        <p className="mb-1 text-[10px] uppercase text-neutral-600">Current</p>
        {editing ? (
          <textarea
            value={stringify(field.current)}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
          />
        ) : (
          <p className="whitespace-pre-wrap text-neutral-200">{stringify(field.current)}</p>
        )}
      </div>
    </div>
  );
}

function BackgroundEditor({ field, editing, onChange }: { field: DiffField; editing: boolean; onChange: (v: unknown) => void }) {
  const current = typeof field.current === "string" ? field.current : "";
  const previous = typeof field.previous === "string" ? field.previous : undefined;
  return (
    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
      <div>
        <p className="mb-1 text-[10px] uppercase text-neutral-600">Previous</p>
        <div className="flex items-center gap-2">
          <span
            className="h-6 w-6 shrink-0 rounded border border-neutral-700"
            style={{ backgroundColor: previous ?? "transparent" }}
          />
          <span className="text-neutral-400">{previous ?? "—"}</span>
        </div>
      </div>
      <div>
        <p className="mb-1 text-[10px] uppercase text-neutral-600">Current</p>
        <div className="flex items-center gap-2">
          <span
            className="h-6 w-6 shrink-0 rounded border border-neutral-700"
            style={{ backgroundColor: current || "transparent" }}
          />
          {editing ? (
            <input
              type="text"
              value={current}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
            />
          ) : (
            <span className="text-neutral-200">{current || "—"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetEditor({ field, editing, onChange }: { field: DiffField; editing: boolean; onChange: (v: unknown) => void }) {
  const prev = field.previous as DiffAssetValue | undefined;
  const curr = (field.current as DiffAssetValue | undefined) ?? { url: "" };

  function update(patch: Partial<DiffAssetValue>) {
    onChange({ ...curr, ...patch });
  }

  const sameFingerprint =
    !!prev?.fingerprint && !!curr.fingerprint && prev.fingerprint === curr.fingerprint;

  return (
    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      <div>
        <p className="mb-1 text-[10px] uppercase text-neutral-600">Previous</p>
        <AssetImage url={prev?.url} alt={prev?.alt} dim />
      </div>
      <div className="space-y-2">
        <p className="mb-1 text-[10px] uppercase text-neutral-600">Current</p>
        <AssetImage url={curr.url} alt={curr.alt} />
        {sameFingerprint && (
          <p className="text-[11px] text-neutral-500">
            Fingerprint matches previous — same image content.
          </p>
        )}
        {editing && (
          <div className="space-y-1">
            <input
              type="text"
              value={curr.url ?? ""}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="Image URL"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-100"
            />
            <input
              type="text"
              value={curr.alt ?? ""}
              onChange={(e) => update({ alt: e.target.value })}
              placeholder="Alt text"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-100"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AssetImage({ url, alt, dim }: { url: string | undefined; alt?: string; dim?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (!url) return <p className="text-neutral-600">—</p>;

  return (
    <div>
      <div
        className={`flex h-40 items-center justify-center overflow-hidden rounded-lg border border-neutral-800/70 bg-neutral-950 ${dim ? "opacity-70" : ""}`}
      >
        {failed ? (
          <span className="px-3 text-center text-[11px] text-red-400/80">⚠ Image failed to load</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={alt ?? ""}
            onError={() => setFailed(true)}
            className="max-h-40 max-w-full object-contain"
          />
        )}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block truncate text-[11px] text-neutral-500 hover:text-blue-400 hover:underline"
        title={url}
      >
        {url}
      </a>
    </div>
  );
}

function LinkEditor({ field, editing, onChange }: { field: DiffField; editing: boolean; onChange: (v: unknown) => void }) {
  const curr = (field.current as DiffLinkValue | undefined) ?? { text: "", href: "" };

  function update(patch: Partial<DiffLinkValue>) {
    onChange({ ...curr, ...patch });
  }

  if (!editing) {
    return (
      <p className="text-sm text-neutral-300">
        <span className="text-neutral-200">{curr.text || "(no label)"}</span>{" "}
        <span className="text-neutral-600">→</span>{" "}
        <span className="text-blue-400">{curr.href || "—"}</span>
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={curr.text ?? ""}
        onChange={(e) => update({ text: e.target.value })}
        placeholder="Link text"
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-100"
      />
      <input
        type="text"
        value={curr.href ?? ""}
        onChange={(e) => update({ href: e.target.value })}
        placeholder="Link href (official site URL)"
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-100"
      />
    </div>
  );
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
