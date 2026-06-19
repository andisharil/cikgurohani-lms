"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string };

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-[5px] px-3 py-2 text-sm transition-colors",
              active
                ? "bg-highlight font-semibold text-ink"
                : "font-medium text-paper/70 hover:bg-white/5 hover:text-paper",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
