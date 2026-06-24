"use client";

import { AnimatedBar } from "@/components/ui/animated-bar";

type ProbabilityBarProps = {
  homeWin: number;
  draw: number;
  awayWin: number;
  homeLabel: string;
  awayLabel: string;
};

export function ProbabilityBar({ homeWin, draw, awayWin, homeLabel, awayLabel }: ProbabilityBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted">
        <span>{homeLabel}</span>
        <span>Empate</span>
        <span>{awayLabel}</span>
      </div>
      <div className="flex h-9 rounded-xl overflow-hidden text-xs font-bold gap-[2px]">
        <div className="relative flex-none overflow-hidden rounded-l-xl" style={{ width: `${homeWin}%` }}>
          <AnimatedBar percentage={100} color="bg-accent-green" />
          <span className="absolute inset-0 flex items-center justify-center text-black z-10">
            {homeWin}%
          </span>
        </div>
        <div className="relative flex-none overflow-hidden" style={{ width: `${draw}%` }}>
          <AnimatedBar percentage={100} color="bg-accent-yellow" delay={0.2} />
          <span className="absolute inset-0 flex items-center justify-center text-black z-10">
            {draw}%
          </span>
        </div>
        <div className="relative flex-none overflow-hidden rounded-r-xl" style={{ width: `${awayWin}%` }}>
          <AnimatedBar percentage={100} color="bg-accent-purple" delay={0.4} />
          <span className="absolute inset-0 flex items-center justify-center text-white z-10">
            {awayWin}%
          </span>
        </div>
      </div>
    </div>
  );
}
