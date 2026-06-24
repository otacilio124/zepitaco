"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Início", exact: true },
  { href: "/dashboard/matches", label: "Análises", exact: false },
  { href: "/dashboard/groups", label: "Grupos", exact: false },
  { href: "/dashboard/calendar", label: "Calendário", exact: false },
  { href: "/dashboard/live", label: "Ao Vivo", exact: false },
  { href: "/dashboard/ranking", label: "Ranking", exact: false },
  { href: "/dashboard/predictions", label: "Pitacos", exact: false },
  { href: "/dashboard/profile", label: "Perfil", exact: false },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border mb-6 overflow-x-auto hide-scrollbar">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap shrink-0 ${
              active ? "text-white" : "text-muted hover:text-white"
            }`}
          >
            {link.label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 gradient-spectrum rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
