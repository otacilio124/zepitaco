import { getWorldCupMatches } from "@/lib/api/football-data";
import { TeamFlag } from "@/components/ui/team-flag";
import { getCountryName } from "@/lib/country-codes";
import { LocalTime } from "@/components/ui/local-time";
import Link from "next/link";

type KnockoutMatch = {
  id: number;
  home: string | null;
  away: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  utcDate: string;
};

const stageLabels: Record<string, string> = {
  LAST_32: "Oitavas de Final",
  LAST_16: "Oitavas",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinais",
  THIRD_PLACE: "Disputa de 3º Lugar",
  FINAL: "Final",
};

const stageOrder = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

function MatchSlot({ match }: { match: KnockoutMatch }) {
  const hasTeams = match.home && match.away;
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";

  const content = (
    <div className={`card p-3 ${hasTeams ? "card-interactive" : ""}`}>
      {isLive && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-red live-pulse" />
          <span className="text-[10px] font-semibold text-accent-red">AO VIVO</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.home ? (
            <>
              <TeamFlag name={match.home} size={20} />
              <span className="text-xs text-white truncate">{getCountryName(match.home)}</span>
            </>
          ) : (
            <span className="text-xs text-muted">A definir</span>
          )}
        </div>
        <div className="px-2 shrink-0">
          {isFinished || isLive ? (
            <span className="text-sm font-bold text-white">{match.homeScore} - {match.awayScore}</span>
          ) : (
            <span className="text-[10px] text-muted">vs</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          {match.away ? (
            <>
              <span className="text-xs text-white truncate text-right">{getCountryName(match.away)}</span>
              <TeamFlag name={match.away} size={20} />
            </>
          ) : (
            <span className="text-xs text-muted">A definir</span>
          )}
        </div>
      </div>

      <div className="text-center mt-2">
        <LocalTime date={match.utcDate} format="datetime" className="text-[10px] text-muted" />
      </div>
    </div>
  );

  if (hasTeams) {
    return <Link href={`/dashboard/matches/${match.id}`}>{content}</Link>;
  }
  return content;
}

export default async function BracketPage() {
  let stages: Map<string, KnockoutMatch[]> = new Map();

  try {
    const data = await getWorldCupMatches();
    for (const m of data.matches) {
      if (m.stage === "GROUP_STAGE") continue;
      if (!stages.has(m.stage)) stages.set(m.stage, []);
      stages.get(m.stage)!.push({
        id: m.id,
        home: m.homeTeam?.shortName || null,
        away: m.awayTeam?.shortName || null,
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
        status: m.status,
        utcDate: m.utcDate,
      });
    }
  } catch {
    // API error
  }

  const orderedStages = stageOrder
    .filter((s) => stages.has(s))
    .map((s) => ({ key: s, label: stageLabels[s] || s, matches: stages.get(s)! }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-white">Eliminatórias</h1>
        <p className="text-xs text-muted mt-0.5">Copa do Mundo 2026 — Fase final</p>
      </div>

      {orderedStages.length > 0 ? (
        <div className="space-y-8">
          {orderedStages.map((stage) => (
            <div key={stage.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold text-accent-purple bg-accent-purple/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {stage.label}
                </span>
                <span className="text-[10px] text-muted">{stage.matches.length} jogos</span>
              </div>

              <div className={`grid gap-2.5 ${
                stage.key === "FINAL" || stage.key === "THIRD_PLACE"
                  ? "grid-cols-1 max-w-md"
                  : stage.key === "SEMI_FINALS"
                    ? "grid-cols-1 md:grid-cols-2 max-w-2xl"
                    : "grid-cols-1 md:grid-cols-2"
              }`}>
                {stage.matches.map((match) => (
                  <MatchSlot key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-sm text-white">As eliminatórias ainda não começaram</p>
          <p className="text-xs text-muted mt-1">Os confrontos serão definidos após a fase de grupos</p>
        </div>
      )}

      <p className="text-[10px] text-muted text-center">
        Football data provided by Football-Data.org
      </p>
    </div>
  );
}
