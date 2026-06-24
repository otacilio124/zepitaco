import { getWorldCupStandings } from "@/lib/api/football-data";
import { TeamFlag } from "@/components/ui/team-flag";

type TableEntry = {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

function GroupTable({ groupName, table }: { groupName: string; table: TableEntry[] }) {
  const letter = groupName.replace("GROUP_", "").replace("Group ", "");

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-xs font-bold text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded-full">
          {letter}
        </span>
        <span className="text-sm font-bold text-white">Grupo {letter}</span>
      </div>

      <div className="grid grid-cols-[1fr_32px_32px_32px_32px_32px_40px] gap-0 px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-border">
        <span>Seleção</span>
        <span className="text-center">J</span>
        <span className="text-center">V</span>
        <span className="text-center">E</span>
        <span className="text-center">D</span>
        <span className="text-center">SG</span>
        <span className="text-center">Pts</span>
      </div>

      {table.map((entry) => {
        const qualifies = entry.position <= 2;
        return (
          <div
            key={entry.team.id}
            className={`grid grid-cols-[1fr_32px_32px_32px_32px_32px_40px] gap-0 px-4 py-2.5 items-center border-b border-border last:border-0 ${
              qualifies ? "bg-accent-green/[0.03]" : ""
            }`}
          >
            <div className="flex items-center gap-2.5">
              {qualifies && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent-green shrink-0" />
              )}
              {!qualifies && <span className="h-1.5 w-1.5 shrink-0" />}
              <TeamFlag name={entry.team.shortName || entry.team.name} size={22} />
              <span className="text-xs font-medium text-white truncate">
                {entry.team.shortName || entry.team.tla}
              </span>
            </div>
            <span className="text-xs text-muted text-center">{entry.playedGames}</span>
            <span className="text-xs text-accent-green text-center">{entry.won}</span>
            <span className="text-xs text-accent-yellow text-center">{entry.draw}</span>
            <span className="text-xs text-accent-red text-center">{entry.lost}</span>
            <span className={`text-xs text-center ${entry.goalDifference > 0 ? "text-accent-green" : entry.goalDifference < 0 ? "text-accent-red" : "text-muted"}`}>
              {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
            </span>
            <span className="text-sm font-bold text-white text-center">{entry.points}</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function GroupsPage() {
  let standings: { group: string; table: TableEntry[] }[] = [];
  let error = false;

  try {
    const data = await getWorldCupStandings();
    standings = data.standings
      .filter((s) => s.type === "TOTAL")
      .sort((a, b) => a.group.localeCompare(b.group));
  } catch {
    error = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">
          Fase de Grupos
        </h1>
        <p className="text-sm text-muted mt-1">
          Copa do Mundo 2026 — Classificação atualizada
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-green" />
          <span>Classifica</span>
        </div>
        <span>J = Jogos · V = Vitórias · E = Empates · D = Derrotas · SG = Saldo</span>
      </div>

      {error ? (
        <div className="card p-8 text-center">
          <p className="text-muted">Não foi possível carregar os grupos.</p>
          <p className="text-xs text-muted mt-1">Verifique o token da API Football-Data.org</p>
        </div>
      ) : standings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {standings.map((s) => (
            <GroupTable key={s.group} groupName={s.group} table={s.table} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-muted">Os grupos ainda não foram definidos.</p>
        </div>
      )}

      <p className="text-[10px] text-muted text-center">
        Football data provided by the Football-Data.org API
      </p>
    </div>
  );
}
