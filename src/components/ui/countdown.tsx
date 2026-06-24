"use client";

import { useEffect, useState } from "react";

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export function Countdown({ targetDate, className }: { targetDate: Date | string; className?: string }) {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(target));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!mounted) {
    return <span className={`font-mono tabular-nums ${className}`}>--:--</span>;
  }

  if (!timeLeft) {
    return <span className={`text-accent-red font-bold ${className}`}>AO VIVO</span>;
  }

  const parts = [];
  if (timeLeft.d > 0) parts.push(`${timeLeft.d}d`);
  parts.push(`${String(timeLeft.h).padStart(2, "0")}h`);
  parts.push(`${String(timeLeft.m).padStart(2, "0")}m`);
  if (timeLeft.d === 0) parts.push(`${String(timeLeft.s).padStart(2, "0")}s`);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {parts.join(" ")}
    </span>
  );
}
