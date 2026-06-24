type StatCardProps = {
  label: string;
  value: string | number;
  color?: "red" | "purple" | "green" | "yellow";
  sublabel?: string;
};

const colorMap = {
  red: "text-accent-red",
  purple: "text-accent-purple",
  green: "text-accent-green",
  yellow: "text-accent-yellow",
};

export function StatCard({ label, value, color = "purple", sublabel }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card-bg border border-card-border p-5">
      <div className="text-sm text-muted mb-1">{label}</div>
      <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
      {sublabel && <div className="text-xs text-muted mt-1">{sublabel}</div>}
    </div>
  );
}
