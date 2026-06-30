"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const mainTabs = [
  { href: "/dashboard", label: "Início", icon: "⚡", exact: true },
  { href: "/dashboard/live", label: "Ao Vivo", icon: "🔴", exact: false },
  { href: "/dashboard/bracket", label: "Eliminatórias", icon: "🏆", exact: false },
];

const moreTabs = [
  { href: "/dashboard/matches", label: "Análises", icon: "📊" },
  { href: "/dashboard/calendar", label: "Calendário", icon: "📅" },
  { href: "/dashboard/predictions", label: "Meus Pitacos", icon: "🎯" },
  { href: "/dashboard/ranking", label: "Ranking", icon: "👑" },
  { href: "/dashboard/profile", label: "Perfil", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreTabs.some((t) => pathname.startsWith(t.href));

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* More menu */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 left-3 right-3 z-50 glass rounded-2xl p-2 max-w-lg mx-auto"
          >
            <div className="grid grid-cols-3 gap-1">
              {moreTabs.map((tab) => {
                const active = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-colors ${
                      active ? "bg-accent-purple/10 text-white" : "text-muted-light hover:text-white"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-[10px] font-medium">{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border md:hidden">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {mainTabs.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                  active ? "text-white" : "text-muted"
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="text-[9px] font-medium">{tab.label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-accent-purple" />}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
              showMore || isMoreActive ? "text-white" : "text-muted"
            }`}
          >
            <span className="text-base leading-none">{showMore ? "✕" : "☰"}</span>
            <span className="text-[9px] font-medium">Mais</span>
            {isMoreActive && !showMore && <span className="w-1 h-1 rounded-full bg-accent-purple" />}
          </button>
        </div>
      </nav>
    </>
  );
}
