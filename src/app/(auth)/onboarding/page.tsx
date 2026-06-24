"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { saveOnboarding } from "@/lib/onboarding-actions";

const countries = [
  { name: "Brasil", id: 6724, code: "br" },
  { name: "Argentina", id: 6722, code: "ar" },
  { name: "França", id: 6723, code: "fr" },
  { name: "Inglaterra", id: 6719, code: "gb-eng" },
  { name: "Espanha", id: 6716, code: "es" },
  { name: "Alemanha", id: 6717, code: "de" },
  { name: "Portugal", id: 6715, code: "pt" },
  { name: "Holanda", id: 6714, code: "nl" },
  { name: "Itália", id: 6718, code: "it" },
  { name: "Bélgica", id: 6721, code: "be" },
  { name: "Colômbia", id: 6729, code: "co" },
  { name: "Uruguai", id: 6725, code: "uy" },
  { name: "EUA", id: 6713, code: "us" },
  { name: "México", id: 6710, code: "mx" },
  { name: "Japão", id: 5812, code: "jp" },
  { name: "Croácia", id: 6720, code: "hr" },
  { name: "Coreia do Sul", id: 5810, code: "kr" },
  { name: "Austrália", id: 5816, code: "au" },
  { name: "Canadá", id: 6703, code: "ca" },
  { name: "Arábia Saudita", id: 7795, code: "sa" },
  { name: "Gana", id: 6735, code: "gh" },
  { name: "Costa Rica", id: 6705, code: "cr" },
  { name: "Panamá", id: 6706, code: "pa" },
  { name: "Iraque", id: 5819, code: "iq" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState(0);
  const [loading, setLoading] = useState(false);

  const selected = countries.find((c) => c.id === selectedId);

  async function handleFinish() {
    if (!selected) return;
    setLoading(true);
    const formData = new FormData();
    formData.set("country", selected.name);
    formData.set("team", selected.name);
    formData.set("teamId", String(selected.id));
    formData.set("league", "Copa do Mundo");
    formData.set("leagueId", "77");
    await saveOnboarding(formData);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "gradient-spectrum" : "bg-card-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex justify-center">
                <Logo size="large" />
              </div>

              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  Bem-vindo ao Zé Pitaco!
                </h1>
                <p className="text-sm text-muted leading-relaxed">
                  Análises inteligentes para a Copa do Mundo 2026.
                  Vamos personalizar sua experiência.
                </p>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full gradient-spectrum rounded-xl py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                Vamos lá
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="country"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-white">
                  Qual sua seleção?
                </h2>
                <p className="text-sm text-muted mt-1">
                  Vamos destacar as análises do seu país
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto hide-scrollbar pr-1">
                {countries.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`card p-3 text-left flex items-center gap-3 transition-all ${
                      selectedId === c.id
                        ? "!border-accent-green bg-accent-green/5"
                        : ""
                    }`}
                  >
                    <Image
                      src={`https://flagcdn.com/w40/${c.code}.png`}
                      alt={c.name}
                      width={28}
                      height={20}
                      className="rounded-sm object-cover"
                      unoptimized
                    />
                    <span className="text-sm font-medium text-white flex-1">
                      {c.name}
                    </span>
                    {selectedId === c.id && (
                      <span className="text-accent-green text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleFinish}
                disabled={!selected || loading}
                className="w-full gradient-spectrum rounded-xl py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? "Entrando..." : "Entrar no Zé Pitaco"}
              </button>

              <button
                onClick={() => setStep(0)}
                className="w-full text-xs text-muted hover:text-white transition-colors py-2"
              >
                ← Voltar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
