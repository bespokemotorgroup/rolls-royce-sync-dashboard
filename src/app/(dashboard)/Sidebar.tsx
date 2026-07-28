"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: IconName; badge?: number };
type NavGroup = { label: string; items: NavItem[] };

export function Sidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-neutral-800 text-neutral-100"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                  }`}
                >
                  {active && (
                    <span className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-400" aria-hidden />
                  )}
                  <Icon name={item.icon} active={active} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {!!item.badge && (
                    <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-400">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export type IconName =
  | "overview"
  | "runs"
  | "review"
  | "approved"
  | "mappings"
  | "changes"
  | "history"
  | "templates"
  | "pages"
  | "section-mapping";

function Icon({ name, active }: { name: IconName; active: boolean }) {
  const cls = `h-4 w-4 shrink-0 ${active ? "text-neutral-200" : "text-neutral-500 group-hover:text-neutral-300"}`;
  const common = {
    className: cls,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
        </svg>
      );
    case "runs":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 0 1 14-5.2M20 12a8 8 0 0 1-14 5.2" />
          <path d="M18 4v3h-3M6 20v-3h3" />
        </svg>
      );
    case "review":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 11.5l2.2 2.2L16 8.5" />
        </svg>
      );
    case "approved":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8.5 12.2l2.3 2.3 4.7-4.7" />
        </svg>
      );
    case "mappings":
      return (
        <svg {...common}>
          <path d="M9 12a3 3 0 1 0 0-6h-2a3 3 0 1 0 0 6" />
          <path d="M15 12a3 3 0 1 0 0 6h2a3 3 0 1 0 0-6" />
          <path d="M9 12h6" />
        </svg>
      );
    case "changes":
      return (
        <svg {...common}>
          <path d="M4 7h11M4 12h16M4 17h11" />
          <circle cx="19" cy="7" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="9" cy="17" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="7.5" />
          <path d="M12 9v4l2.6 1.6" />
          <path d="M8.5 3.5L6 6M15.5 3.5L18 6" />
        </svg>
      );
    case "templates":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="1.5" />
          <path d="M4 9.5h16M9.5 9.5V20" />
        </svg>
      );
    case "pages":
      return (
        <svg {...common}>
          <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5z" />
          <path d="M14 3.5V8h4" />
          <path d="M9 12.5h6M9 15.5h6" />
        </svg>
      );
    case "section-mapping":
      return (
        <svg {...common}>
          <path d="M9 4L4 6.5v13L9 17l6 2.5 5-2.5v-13L15 6.5 9 4z" />
          <path d="M9 4v13M15 6.5v13" />
        </svg>
      );
  }
}
