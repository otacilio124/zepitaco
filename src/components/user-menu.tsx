"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
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
        className="h-9 w-9 rounded-full bg-card-bg border border-card-border flex items-center justify-center text-sm font-medium text-white hover:border-accent-purple transition-colors"
      >
        {initials}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-56 rounded-xl bg-card-bg border border-card-border shadow-xl py-2">
            <div className="px-4 py-2 border-b border-card-border">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-4 py-2 text-sm text-accent-red hover:bg-white/5 transition-colors"
            >
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  );
}
