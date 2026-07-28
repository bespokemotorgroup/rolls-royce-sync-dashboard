export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-800 pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-neutral-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
