"use client";

import { useState } from "react";

export function HashChip({
  value,
  tone,
}: {
  value: string | null | undefined;
  tone?: "warn";
}) {
  const [expanded, setExpanded] = useState(false);

  if (!value) return <span className="text-neutral-600">—</span>;

  const short = value.slice(0, 10);
  const toneClass =
    tone === "warn"
      ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200"
      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200";

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      title={value}
      className={`rounded px-1.5 py-0.5 font-mono text-xs transition ${toneClass}`}
    >
      {expanded ? value : `${short}…`}
    </button>
  );
}
