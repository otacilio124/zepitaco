"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type Props = {
  total: number;
  correct: number;
  exact: number;
  label: string;
};

export function PerformanceRing({ total, correct, exact, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const exactPct = total > 0 ? Math.round((exact / total) * 100) : 0;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const correctOffset = circumference - (circumference * pct) / 100;
  const exactOffset = circumference - (circumference * exactPct) / 100;

  return (
    <div ref={ref} className="flex items-center gap-4 lg:gap-5">
      <div className="relative h-24 w-24 lg:h-28 lg:w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r={radius} fill="none"
            stroke="var(--accent-green)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={isInView ? { strokeDashoffset: correctOffset } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.circle
            cx="50" cy="50" r={radius - 9} fill="none"
            stroke="var(--accent-yellow)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * (radius - 9)}
            initial={{ strokeDashoffset: 2 * Math.PI * (radius - 9) }}
            animate={isInView ? { strokeDashoffset: (2 * Math.PI * (radius - 9)) - ((2 * Math.PI * (radius - 9)) * exactPct) / 100 } : {}}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{pct}%</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-white">{label}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-accent-green" />
          <span className="text-muted-light">Acertou vencedor: {correct}/{total}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-accent-yellow" />
          <span className="text-muted-light">Placar exato: {exact}/{total}</span>
        </div>
      </div>
    </div>
  );
}
