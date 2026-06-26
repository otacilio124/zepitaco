import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";
import { getCountryName } from "@/lib/country-codes";
import { LocalTime } from "@/components/ui/local-time";

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
  return <span className={`text-[10px] lg:text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

export function MatchCard({ match }: { match: Match }) {
  return (
    <Link href={`/dashboard/matches/${match.matchId}`} className="card card-interactive block p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3">
        <LocalTime date={match.matchDate} format="datetime" className="text-xs lg:text-sm text-muted" />
        <StatusBadge status={match.status} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 lg:gap-3 flex-1 min-w-0">
          <TeamFlag name={match.homeTeam} size={24} />
          <span className="text-sm lg:text-base font-medium text-white truncate">{getCountryName(match.homeTeam)}</span>
        </div>
        <div className="px-3 lg:px-4 text-center shrink-0">
          {match.status === "scheduled" ? (
            <span className="text-sm lg:text-base text-muted">vs</span>
          ) : (
            <span className="text-base lg:text-lg font-bold text-white">{match.homeScore ?? "-"} - {match.awayScore ?? "-"}</span>
          )}
        </div>
        <div className="flex items-center gap-2.5 lg:gap-3 flex-1 min-w-0 justify-end">
          <span className="text-sm lg:text-base font-medium text-white truncate text-right">{getCountryName(match.awayTeam)}</span>
          <TeamFlag name={match.awayTeam} size={24} />
        </div>
      </div>
    </Link>
  );
}
