import Link from "next/link";
import { Logo } from "./logo";
import { auth } from "@/lib/auth";
import { UserMenu } from "./user-menu";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8 h-14 md:h-16">
        <Link href={session?.user ? "/dashboard" : "/"}>
          <Logo size="small" />
        </Link>

        <nav className="flex items-center gap-3">
          {session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-secondary !py-2 !px-4 !text-xs">
                Entrar
              </Link>
              <Link href="/register" className="btn-primary !py-2 !px-4 !text-xs">
                Criar Conta
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
