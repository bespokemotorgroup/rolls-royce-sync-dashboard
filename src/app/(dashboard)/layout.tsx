import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/runs", label: "Runs" },
  { href: "/mappings", label: "Pending Mappings" },
  { href: "/changes", label: "Recent Changes" },
  { href: "/templates", label: "Templates" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-neutral-100">RR Content Sync</p>
            <p className="text-xs text-neutral-500">Admin dashboard</p>
          </div>
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-neutral-500 transition hover:text-neutral-300"
            >
              Sign out
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-6 pb-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
