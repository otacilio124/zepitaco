type ScoreBarProps = {
  label: string;
  homeValue: number;
  awayValue: number;
  homeLabel: string;
  awayLabel: string;
};

export function ScoreBar({ label, homeValue, awayValue, homeLabel, awayLabel }: ScoreBarProps) {
  const total = homeValue + awayValue || 1;
  const homePct = Math.round((homeValue / total) * 100);
  const awayPct = 100 - homePct;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted">
        <span>{homeLabel}</span>
        <span className="text-white font-medium">{label}</span>
        <span>{awayLabel}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-card-border">
        <div
          className="bg-accent-green transition-all duration-500"
          style={{ width: `${homePct}%` }}
        />
        <div
          className="bg-accent-purple transition-all duration-500"
          style={{ width: `${awayPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs font-medium">
        <span className="text-accent-green">{homePct}%</span>
        <span className="text-accent-purple">{awayPct}%</span>
      </div>
    </div>
  );
}
