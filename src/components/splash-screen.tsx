"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

function TrophyIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d91a3d" />
          <stop offset="35%" stopColor="#622bd9" />
          <stop offset="70%" stopColor="#1bf266" />
          <stop offset="100%" stopColor="#ebdf3a" />
        </linearGradient>
      </defs>
      {/* Cup bowl */}
      <path
        d="M30 20 L70 20 L67 45 Q67 60 50 62 Q33 60 33 45 Z"
        fill="url(#trophyGrad)"
      />
      {/* Left handle */}
      <path
        d="M30 24 Q14 24 14 38 Q14 50 28 50"
        fill="none"
        stroke="url(#trophyGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Right handle */}
      <path
        d="M70 24 Q86 24 86 38 Q86 50 72 50"
        fill="none"
        stroke="url(#trophyGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Stem */}
      <rect x="46" y="61" width="8" height="14" fill="url(#trophyGrad)" />
      {/* Base */}
      <path d="M36 75 L64 75 L68 86 L32 86 Z" fill="url(#trophyGrad)" />
      <rect x="28" y="86" width="44" height="6" rx="2" fill="url(#trophyGrad)" />
      {/* Star detail */}
      <path
        d="M50 28 L52.5 34 L59 34 L53.8 38 L55.8 44 L50 40.5 L44.2 44 L46.2 38 L41 34 L47.5 34 Z"
        fill="#060606"
        opacity="0.3"
      />
    </svg>
  );
}

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("splash-seen")) {
      setDone(true);
      return;
    }

    const timer = setTimeout(() => finish(), 2400);
    return () => clearTimeout(timer);
  }, []);

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
              {/* Trophy with spin-in + glow pulse */}
              <motion.div
                initial={{ opacity: 0, scale: 0.4, rotate: -25 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-20 h-20 sm:w-24 sm:h-24"
              >
                <motion.div
                  animate={{ filter: ["drop-shadow(0 0 0px #622bd9)", "drop-shadow(0 0 14px #622bd9aa)", "drop-shadow(0 0 0px #622bd9)"] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full"
                >
                  <TrophyIcon />
                </motion.div>
              </motion.div>

              {/* Logo fade + slide up */}
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

              {/* Loading bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="w-32 h-0.5 rounded-full bg-border overflow-hidden"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 1.3, delay: 1, ease: "easeInOut" }}
                  className="h-full w-full gradient-spectrum"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={fadeOut ? "" : "hidden"}>{children}</div>
    </>
  );
}
