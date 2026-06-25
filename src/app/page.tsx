import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return (
    <div className="flex flex-col flex-1">
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 md:py-32 text-center">
        <div className="max-w-xl space-y-8">
          <div className="flex justify-center">
            <Logo size="large" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
              Análises inteligentes para a Copa do Mundo 2026
            </h1>
            <p className="text-muted-light text-base md:text-lg leading-relaxed max-w-md mx-auto">
              Escalações, estatísticas e estimativas de placar para você dar o melhor pitaco.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register" className="btn-primary w-full sm:w-auto text-center px-8">
              Criar Conta Grátis
            </Link>
            <Link href="/login" className="btn-secondary w-full sm:w-auto text-center px-8">
              Entrar
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-accent-purple uppercase tracking-widest text-center mb-2">
            Features
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-12">
            Tudo para dar o pitaco certo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: "Análise de Confrontos",
                desc: "Probabilidades, posse de bola e finalizações estimadas a partir dos dados reais da Copa.",
              },
              {
                title: "Escalações Prováveis",
                desc: "Elencos oficiais com 26 jogadores por seleção, formação tática visual e técnico.",
              },
              {
                title: "Acompanhe ao Vivo",
                desc: "Placares atualizados, artilheiros, melhores defesas e classificação dos grupos.",
              },
            ].map((f) => (
              <div key={f.title} className="card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-md mx-auto card p-8 text-center gradient-border rounded-2xl">
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: "48", label: "Seleções" },
              { value: "104", label: "Partidas" },
              { value: "3", label: "Países-Sede" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-6 py-20 text-center">
        <div className="max-w-sm mx-auto space-y-5">
          <h2 className="text-xl font-bold text-white">Pronto para começar?</h2>
          <p className="text-sm text-muted">100% gratuito. Crie sua conta em segundos.</p>
          <Link href="/register" className="btn-primary inline-block px-10">
            Começar Agora
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-5 text-center">
        <p className="text-xs text-muted">
          Zé Pitaco © 2026 · Football data provided by Football-Data.org
        </p>
      </footer>
    </div>
  );
}
