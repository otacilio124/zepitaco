"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type User = {
  name?: string | null;
  email?: string | null;
};

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  const initials = (user.name || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-8 w-8 rounded-full bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-xs font-semibold text-accent-purple hover:bg-accent-purple/20 transition-colors"
      >
        {initials}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 z-50 w-52 rounded-xl bg-surface border border-border shadow-2xl py-1 overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-xs font-medium text-white truncate">{user.name}</p>
                <p className="text-[10px] text-muted truncate">{user.email}</p>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-xs text-muted-light hover:text-white hover:bg-surface-hover transition-colors"
              >
                Meu Perfil
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left px-3 py-2 text-xs text-accent-red hover:bg-surface-hover transition-colors"
              >
                Sair
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
