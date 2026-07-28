"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Option = {
  id: string;
  source_url: string;
  target_slug: string | null;
  target_collection: string;
};

export function PageSelector({ options, selectedId }: { options: Option[]; selectedId?: string }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.source_url.toLowerCase().includes(q) ||
        (o.target_slug ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  return (
    <div className="rounded-xl border border-neutral-800/80 shadow-sm shadow-black/20 bg-neutral-900">
      <div className="border-b border-neutral-800 p-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by URL or slug…"
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-neutral-500"
        />
      </div>
      <ul className="max-h-80 divide-y divide-neutral-800 overflow-y-auto">
        {filtered.map((o) => (
          <li key={o.id}>
            <Link
              href={`/section-mapping?page=${o.id}`}
              className={`block px-3 py-2 text-sm transition ${
                selectedId === o.id
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200"
              }`}
            >
              <p className="truncate">{o.target_slug ?? o.source_url}</p>
              <p className="truncate text-xs text-neutral-500">
                {o.target_collection} · {o.source_url}
              </p>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-neutral-500">No matches.</li>
        )}
      </ul>
    </div>
  );
}
