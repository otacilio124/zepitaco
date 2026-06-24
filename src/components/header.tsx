import Link from "next/link";
import { Logo } from "./logo";
import { auth } from "@/lib/auth";
import { UserMenu } from "./user-menu";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2.5">
        <Link href={session?.user ? "/dashboard" : "/"} className="hover:opacity-90 transition-opacity">
          <Logo size="small" />
        </Link>

        <nav className="flex items-center gap-4">
          {session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-muted hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm gradient-spectrum rounded-xl px-5 py-2 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Criar Conta
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
