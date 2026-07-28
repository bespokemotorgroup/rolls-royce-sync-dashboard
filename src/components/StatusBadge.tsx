const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  completed: { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  published: { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  approved: { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  running: { pill: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  pending: { pill: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  pending_review: { pill: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  detected: { pill: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  draft_updated: { pill: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  requires_mapping: { pill: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  completed_with_errors: { pill: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400" },
  superseded: { pill: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20", dot: "bg-neutral-500" },
  failed: { pill: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
  rejected: { pill: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
};

const DEFAULT_STYLE = { pill: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20", dot: "bg-neutral-500" };

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = status ?? "unknown";
  const style = STATUS_STYLES[label] ?? DEFAULT_STYLE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden />
      {label.replace(/_/g, " ")}
    </span>
  );
}
