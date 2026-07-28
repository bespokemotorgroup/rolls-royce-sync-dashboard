"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; badge?: number };
type NavGroup = { label: string; items: NavItem[] };

export function NavBar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 pb-3">
      {groups.map((group, i) => (
        <div key={group.label} className="flex items-center gap-x-6">
          {i > 0 && <span className="hidden h-4 w-px bg-neutral-800 sm:block" aria-hidden />}
          <div className="flex items-center gap-1">
            {group.items.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-neutral-800 text-neutral-100"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                  }`}
                >
                  {item.label}
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
