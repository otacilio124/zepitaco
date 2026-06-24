"use client";

import { AnimatedBar } from "@/components/ui/animated-bar";

type StatComparisonProps = {
  stats: {
    label: string;
    homeValue: number;
    awayValue: number;
    format?: "number" | "percent" | "decimal";
  }[];
};

function formatValue(value: number, format: string = "number"): string {
  if (format === "percent") return `${Math.round(value)}%`;
  if (format === "decimal") return value.toFixed(1);
  return String(Math.round(value));
}

export function StatComparison({ stats }: StatComparisonProps) {
  return (
    <div className="space-y-4">
      {stats.map((stat, i) => {
        const total = stat.homeValue + stat.awayValue || 1;
        const homePct = (stat.homeValue / total) * 100;

        return (
          <div key={stat.label} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-accent-green font-semibold">
                {formatValue(stat.homeValue, stat.format)}
              </span>
              <span className="text-muted">{stat.label}</span>
              <span className="text-accent-purple font-semibold">
                {formatValue(stat.awayValue, stat.format)}
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-card-border gap-[1px]">
              <AnimatedBar
                percentage={homePct}
                color="bg-accent-green"
                delay={i * 0.1}
                className="flex-1 rounded-l-full"
              />
              <AnimatedBar
                percentage={100 - homePct}
                color="bg-accent-purple"
                delay={i * 0.1 + 0.1}
                className="flex-1 rounded-r-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
