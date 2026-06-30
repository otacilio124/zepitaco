"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const MAX_WAIT_MS = 12000;
const MIN_SHOW_MS = 1500;

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [ready, setReady] = useState(false);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("splash-seen")) {
      setDone(true);
      return;
    }

    startRef.current = Date.now();
    let cancelled = false;

    async function pollHealth() {
      while (!cancelled) {
        try {
          const res = await fetch("/api/health", { cache: "no-store" });
          const data = await res.json();
          if (data.ready) {
            if (!cancelled) setReady(true);
            return;
          }
        } catch {
          // retry
        }
        if (Date.now() - startRef.current > MAX_WAIT_MS) {
          if (!cancelled) setReady(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 700));
      }
    }

    pollHealth();
    return () => { cancelled = true; };
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
            <div className="flex flex-col items-center gap-5">
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

              {/* Status text + loading bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-32 h-0.5 rounded-full bg-border overflow-hidden">
                  <motion.div
                    animate={{ x: ready ? "0%" : ["-100%", "100%"] }}
                    transition={
                      ready
                        ? { duration: 0.4, ease: "easeOut" }
                        : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                    }
                    className="h-full w-full gradient-spectrum"
                  />
                </div>
                <span className="text-[10px] text-muted">
                  {ready ? "Pronto" : "Sincronizando dados ao vivo..."}
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
