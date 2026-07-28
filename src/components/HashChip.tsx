"use client";

import { useState } from "react";

export function HashChip({ value }: { value: string | null | undefined }) {
  const [expanded, setExpanded] = useState(false);

  if (!value) return <span className="text-neutral-600">—</span>;

  const short = value.slice(0, 10);

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      title={value}
      className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-neutral-400 transition hover:bg-neutral-700 hover:text-neutral-200"
    >
      {expanded ? value : `${short}…`}
    </button>
  );
}
