"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex justify-center">
          <Logo size="default" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold text-white text-center">
            Entrar na sua conta
          </h2>

          {error && (
            <div className="rounded-xl bg-accent-red/10 border border-accent-red/20 px-4 py-3 text-xs text-accent-red">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all"
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              required
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-xs text-muted">
            Não tem conta?{" "}
            <Link href="/register" className="text-accent-purple hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
