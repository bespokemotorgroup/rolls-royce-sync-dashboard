import { queryOne } from "@/lib/db";
import { Sidebar } from "./Sidebar";

async function getBadgeCounts() {
  const [review, mappings] = await Promise.all([
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM change_events WHERE status = 'pending_review'`,
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM field_mappings WHERE status = 'pending'`,
    ),
  ]);
  return {
    pendingReview: Number(review?.count ?? 0),
    pendingMappings: Number(mappings?.count ?? 0),
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { pendingReview, pendingMappings } = await getBadgeCounts();

  const navGroups = [
    {
      label: "Monitor",
      items: [
        { href: "/", label: "Overview", icon: "overview" as const },
        { href: "/runs", label: "Runs", icon: "runs" as const },
      ],
    },
    {
      label: "Review",
      items: [
        { href: "/review", label: "Review Queue", icon: "review" as const, badge: pendingReview },
        { href: "/approved", label: "Approved", icon: "approved" as const },
        { href: "/mappings", label: "Pending Mappings", icon: "mappings" as const, badge: pendingMappings },
      ],
    },
    {
      label: "Records",
      items: [
        { href: "/changes", label: "Recent Changes", icon: "changes" as const },
        { href: "/history", label: "History", icon: "history" as const },
        { href: "/templates", label: "Templates", icon: "templates" as const },
      ],
    },
    {
      label: "Inspect",
      items: [
        { href: "/pages", label: "All Pages", icon: "pages" as const },
        { href: "/section-mapping", label: "Section Mapping", icon: "section-mapping" as const },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900/40">
        <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-bold text-neutral-900">
            RR
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-neutral-100">
              Content Sync
            </p>
            <p className="truncate text-xs leading-tight text-neutral-500">Admin dashboard</p>
          </div>
        </div>

        <Sidebar groups={navGroups} />

        <form action="/api/logout" method="POST" className="border-t border-neutral-800 p-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-500 transition hover:bg-neutral-900 hover:text-neutral-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 4.5h2.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H15" />
              <path d="M10 8l-4 4 4 4M6 12h12" />
            </svg>
            Sign out
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 px-6 py-3 backdrop-blur lg:px-10">
          <p className="text-xs text-neutral-500">
            Review and approve official-site changes before they go live — this dashboard is the
            only way changes get approved.
          </p>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
