const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  detected: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  requires_mapping: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed_with_errors: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = status ?? "unknown";
  const style = STATUS_STYLES[label] ?? "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}
