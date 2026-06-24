import {
  getUpcomingMatches,
  getLiveMatches,
  getRecentResults,
} from "@/lib/queries";
import { MatchCard } from "@/components/matches/match-card";

export default async function MatchesPage() {
  const [upcoming, live, recent] = await Promise.all([
    getUpcomingMatches(50),
    getLiveMatches(),
    getRecentResults(50),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Partidas</h1>

      {live.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-red animate-pulse" />
            Ao Vivo ({live.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {live.map((match) => (
              <MatchCard key={match.matchId} match={match} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">
          Agendadas ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((match) => (
              <MatchCard key={match.matchId} match={match}  />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card-bg border border-card-border p-8 text-center text-muted">
            Nenhuma partida agendada.
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">
          Encerradas ({recent.length})
        </h2>
        {recent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map((match) => (
              <MatchCard key={match.matchId} match={match} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card-bg border border-card-border p-8 text-center text-muted">
            Nenhum resultado ainda.
          </div>
        )}
      </section>
    </div>
  );
}
