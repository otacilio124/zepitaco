"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const MAX_WAIT_MS = 20000;
const MIN_SHOW_MS = 1800;

type StepKey = "scoreboard" | "standings" | "bracket";
type Steps = Record<StepKey, boolean>;

const STEP_CONFIG: { key: StepKey; label: string }[] = [
  { key: "scoreboard", label: "Resultados ao vivo" },
  { key: "standings", label: "Classificação" },
  { key: "bracket", label: "Chaveamento" },
];

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [ready, setReady] = useState(false);
  const [steps, setSteps] = useState<Steps>({ scoreboard: false, standings: false, bracket: false });
  const startRef = useRef<number>(0);
  const resolvedRef = useRef<Steps>({ scoreboard: false, standings: false, bracket: false });

  function markDone(key: StepKey) {
    resolvedRef.current[key] = true;
    setSteps({ ...resolvedRef.current });
  }

  function checkAllDone() {
    const r = resolvedRef.current;
    return r.scoreboard && r.standings && r.bracket;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("splash-seen")) {
      setDone(true);
      return;
    }

    startRef.current = Date.now();
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, MAX_WAIT_MS);

    // Health: scoreboard + standings (fast, ~3s)
    async function fetchHealth() {
      while (!cancelled) {
        try {
          const res = await fetch("/api/health", { cache: "no-store" });
          const data = await res.json();
          if (!cancelled) {
            if (data.services?.espnScoreboard) markDone("scoreboard");
            if (data.services?.espnStandings) markDone("standings");
            if (data.ready && checkAllDone()) {
              setReady(true);
              return;
            }
            if (data.ready) return; // health done, bracket still running
          }
        } catch {
          // retry
        }
        if (Date.now() - startRef.current > MAX_WAIT_MS) return;
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    // Bracket: heavy — can take 5-15s, but this warms the server cache
    async function fetchBracket() {
      try {
        const res = await fetch("/api/football/knockout", { cache: "no-store" });
        if (!cancelled && res.ok) {
          markDone("bracket");
          if (checkAllDone()) setReady(true);
        }
      } catch {
        // timeout fallback handles it
      }
    }

    fetchHealth();
    fetchBracket();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, MIN_SHOW_MS - elapsed);
    const timer = setTimeout(() => finish(), remaining);
    return () => clearTimeout(timer);
  }, [ready]);

  function finish() {
    setFadeOut(true);
    setTimeout(() => {
      setDone(true);
      sessionStorage.setItem("splash-seen", "1");
    }, 500);
  }

  const completedCount = Object.values(steps).filter(Boolean).length;
  const progress = ready ? 100 : Math.round((completedCount / STEP_CONFIG.length) * 90);

  if (done) return <>{children}</>;

  return (
    <>
      <AnimatePresence>
        {!fadeOut && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-[#060606] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6 w-64">
              {/* World Cup logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.4, rotate: -25 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-20 h-20 sm:w-24 sm:h-24"
              >
                <motion.div
                  animate={{
                    filter: [
                      "drop-shadow(0 0 0px #622bd9)",
                      "drop-shadow(0 0 14px #622bd9aa)",
                      "drop-shadow(0 0 0px #622bd9)",
                    ],
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full"
                >
                  <Image
                    src="/worldcup-logo.svg"
                    alt="Copa do Mundo 2026"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    priority
                  />
                </motion.div>
              </motion.div>

              {/* Zé Pitaco logo */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Image
                  src="/logo.png"
                  alt="Zé Pitaco"
                  width={180}
                  height={78}
                  className="object-contain"
                  priority
                />
              </motion.div>

              {/* Steps */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="w-full flex flex-col gap-2.5"
              >
                {STEP_CONFIG.map((step, i) => {
                  const isComplete = steps[step.key] || ready;
                  return (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + i * 0.12 }}
                      className="flex items-center gap-2.5"
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {isComplete ? (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            viewBox="0 0 16 16"
                            className="w-3.5 h-3.5 text-accent-green"
                            fill="none"
                          >
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </motion.svg>
                        ) : (
                          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 animate-spin" fill="none">
                            <circle cx="8" cy="8" r="6.5" stroke="var(--border)" strokeWidth="1.5" />
                            <path d="M8 1.5A6.5 6.5 0 0 1 14.5 8" stroke="var(--accent-purple)" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-[11px] transition-colors duration-300 ${isComplete ? "text-white" : "text-muted"}`}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Progress bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="w-full flex flex-col items-center gap-2"
              >
                <div className="w-full h-0.5 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full gradient-spectrum rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[10px] text-muted">
                  {ready
                    ? "Pronto para o jogo!"
                    : `${completedCount} de ${STEP_CONFIG.length} serviços carregados`}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={fadeOut ? "" : "hidden"}>{children}</div>
    </>
  );
}
