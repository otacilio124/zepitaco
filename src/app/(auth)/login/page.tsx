"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { loginUser } from "@/lib/auth-actions";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginUser(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo size="large" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-white text-center">
            Entrar na sua conta
          </h2>

          {error && (
            <div className="rounded-lg bg-accent-red/10 border border-accent-red/20 px-4 py-3 text-sm text-accent-red">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              className="w-full rounded-lg bg-card-bg border border-card-border px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent-purple transition-colors"
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              required
              className="w-full rounded-lg bg-card-bg border border-card-border px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent-purple transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-spectrum rounded-lg py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-sm text-muted">
            Não tem conta?{" "}
            <Link
              href="/register"
              className="text-accent-purple hover:text-accent-green transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
