"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Início", icon: "⚡", exact: true },
  { href: "/dashboard/groups", label: "Grupos", icon: "🏆", exact: false },
  { href: "/dashboard/calendar", label: "Jogos", icon: "📅", exact: false },
  { href: "/dashboard/ranking", label: "Ranking", icon: "🎯", exact: false },
  { href: "/dashboard/profile", label: "Perfil", icon: "👤", exact: false },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${
                active ? "text-white" : "text-muted"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && (
                <span className="absolute -bottom-1 w-5 h-0.5 rounded-full gradient-spectrum" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
