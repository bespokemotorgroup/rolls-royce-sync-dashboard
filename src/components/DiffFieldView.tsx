import type { DiffAssetValue, DiffField, DiffLinkValue } from "@/lib/types";

export function DiffFieldView({ field }: { field: DiffField }) {
  return (
    <div className="rounded-lg border border-neutral-800/70 bg-neutral-950 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
          {field.kind}
        </span>
        <code className="truncate text-xs text-neutral-500">{field.sourceKey}</code>
      </div>
      <FieldValue field={field} />
    </div>
  );
}

function FieldValue({ field }: { field: DiffField }) {
  switch (field.kind) {
    case "background":
      return <BackgroundValue previous={field.previous} current={field.current} />;
    case "asset":
      return <AssetValue previous={field.previous} current={field.current} />;
    case "link":
      return <LinkValue previous={field.previous} current={field.current} />;
    default:
      return <TextValue previous={field.previous} current={field.current} />;
  }
}

function TextValue({ previous, current }: { previous: unknown; current: unknown }) {
  return (
    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
      <div>
        <p className="mb-1 text-[10px] uppercase text-neutral-600">Previous</p>
        <p className="whitespace-pre-wrap text-neutral-500 line-through decoration-neutral-700">
          {stringify(previous)}
        </p>
      </div>
      <div>
        <p className="mb-1 text-[10px] uppercase text-neutral-600">Current</p>
        <p className="whitespace-pre-wrap text-neutral-200">{stringify(current)}</p>
      </div>
    </div>
  );
}

function BackgroundValue({ previous, current }: { previous: unknown; current: unknown }) {
  return (
    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
      <Swatch label="Previous" color={typeof previous === "string" ? previous : undefined} />
      <Swatch label="Current" color={typeof current === "string" ? current : undefined} />
    </div>
  );
}

function Swatch({ label, color }: { label: string; color: string | undefined }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase text-neutral-600">{label}</p>
      <div className="flex items-center gap-2">
        <span
          className="h-6 w-6 shrink-0 rounded border border-neutral-700"
          style={{ backgroundColor: color ?? "transparent" }}
        />
        <span className="text-neutral-400">{color ?? "—"}</span>
      </div>
    </div>
  );
}

function AssetValue({ previous, current }: { previous: unknown; current: unknown }) {
  const prev = previous as DiffAssetValue | undefined;
  const curr = current as DiffAssetValue | undefined;

  const sameUrl = !!prev?.url && !!curr?.url && prev.url === curr.url;
  const sameFingerprint =
    !!prev?.fingerprint && !!curr?.fingerprint && prev.fingerprint === curr.fingerprint;

  let note: string | null = null;
  if (prev?.url && curr?.url) {
    if (sameFingerprint) {
      note =
        "Same image content (fingerprint matches) — only the URL/CDN path changed, or nothing visually changed at all.";
    } else if (sameUrl) {
      note = "Same URL, but the file behind it was replaced — fingerprint differs.";
    } else if (prev.fingerprint && curr.fingerprint) {
      note = "Different image content (fingerprint differs).";
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <AssetSide label="Previous" asset={prev} dim />
        <AssetSide label="Current" asset={curr} />
      </div>
      {note && <p className="mt-2 text-[11px] text-neutral-500">{note}</p>}
    </div>
  );
}

function AssetSide({
  label,
  asset,
  dim,
}: {
  label: string;
  asset: DiffAssetValue | undefined;
  dim?: boolean;
}) {
  if (!asset?.url) {
    return (
      <div>
        <p className="mb-1 text-[10px] uppercase text-neutral-600">{label}</p>
        <p className="text-neutral-600">—</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-[10px] uppercase text-neutral-600">{label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.url}
        alt={asset.alt ?? ""}
        className={`max-h-40 rounded-lg border border-neutral-800/70 object-contain ${dim ? "opacity-70" : ""}`}
      />
      <p className="mt-1 truncate text-[11px] text-neutral-600" title={asset.url}>
        {asset.url}
      </p>
      {asset.fingerprint && (
        <p className="truncate font-mono text-[10px] text-neutral-700" title={asset.fingerprint}>
          fp: {asset.fingerprint.slice(0, 20)}…
        </p>
      )}
    </div>
  );
}

function LinkValue({ current }: { previous: unknown; current: unknown }) {
  const curr = current as DiffLinkValue | undefined;
  return (
    <p className="text-sm text-neutral-300">
      <span className="text-neutral-200">{curr?.text ?? "(no label)"}</span>{" "}
      <span className="text-neutral-600">→</span>{" "}
      <span className="text-blue-400">{curr?.href ?? "—"}</span>
    </p>
  );
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
