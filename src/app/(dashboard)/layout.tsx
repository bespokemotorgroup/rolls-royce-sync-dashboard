import { queryOne } from "@/lib/db";
import { NavBar } from "./NavBar";

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
        { href: "/", label: "Overview" },
        { href: "/runs", label: "Runs" },
      ],
    },
    {
      label: "Review",
      items: [
        { href: "/review", label: "Review Queue", badge: pendingReview },
        { href: "/approved", label: "Approved" },
        { href: "/mappings", label: "Pending Mappings", badge: pendingMappings },
      ],
    },
    {
      label: "Records",
      items: [
        { href: "/changes", label: "Recent Changes" },
        { href: "/history", label: "History" },
        { href: "/templates", label: "Templates" },
      ],
    },
    {
      label: "Inspect",
      items: [
        { href: "/pages", label: "All Pages" },
        { href: "/section-mapping", label: "Section Mapping" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-bold text-neutral-900">
              RR
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-neutral-100">
                Content Sync Dashboard
              </p>
              <p className="text-xs leading-tight text-neutral-500">
                Review and approve official-site changes before they go live
              </p>
            </div>
          </div>
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-300"
            >
              Sign out
            </button>
          </form>
        </div>
        <NavBar groups={navGroups} />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
