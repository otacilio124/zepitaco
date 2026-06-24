import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";

type Match = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: Date | string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    live: { label: "AO VIVO", color: "bg-accent-red text-white live-pulse" },
    scheduled: { label: "AGENDADO", color: "bg-accent-purple/20 text-accent-purple" },
    finished: { label: "ENCERRADO", color: "bg-border text-muted" },
    cancelled: { label: "CANCELADO", color: "bg-border text-muted line-through" },
  };
  const { label, color } = config[status] ?? config.scheduled;

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const date = new Date(match.matchDate);
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link
      href={`/dashboard/matches/${match.matchId}`}
      className="card card-interactive block p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{dateStr}</span>
          <span className="text-xs text-white font-medium">{timeStr}</span>
        </div>
        <StatusBadge status={match.status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <TeamFlag name={match.homeTeam} size={28} />
          <span className="text-sm font-medium text-white truncate">{match.homeTeam}</span>
        </div>

        <div className="px-3 text-center shrink-0">
          {match.status === "scheduled" ? (
            <span className="text-base text-muted font-mono">vs</span>
          ) : (
            <span className="text-lg font-bold text-white">
              {match.homeScore ?? "-"} - {match.awayScore ?? "-"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium text-white truncate text-right">{match.awayTeam}</span>
          <TeamFlag name={match.awayTeam} size={28} />
        </div>
      </div>
    </Link>
  );
}
