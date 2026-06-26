import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUpcomingMatches, getUserPredictions, getUserPredictionForMatch } from "@/lib/queries";
import { MatchCard } from "@/components/matches/match-card";
import { PredictionForm } from "@/components/predictions/prediction-form";
import { LocalTime } from "@/components/ui/local-time";
import { ScoreBar } from "@/components/stats/score-bar";
import { getCountryName } from "@/lib/country-codes";

export default async function PredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const selectedMatchId = params.match ? Number(params.match) : null;

  const [upcoming, userPredictions] = await Promise.all([
    getUpcomingMatches(20),
    getUserPredictions(session.user.id),
  ]);

  const selectedMatch = selectedMatchId
    ? upcoming.find((m) => m.matchId === selectedMatchId)
    : null;

  let existingPrediction = null;
  if (selectedMatchId) {
    existingPrediction = await getUserPredictionForMatch(session.user.id, selectedMatchId);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Palpites</h1>

      {/* Prediction Form */}
      {selectedMatch && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Registrar Palpite</h2>
          <MatchCard match={selectedMatch} />
          <PredictionForm
            matchId={selectedMatch.matchId}
            homeTeam={getCountryName(selectedMatch.homeTeam)}
            awayTeam={getCountryName(selectedMatch.awayTeam)}
            existingHome={existingPrediction?.predictedHomeScore}
            existingAway={existingPrediction?.predictedAwayScore}
          />
        </section>
      )}

      {/* Pick a match */}
      {!selectedMatch && upcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            Escolha uma partida para palpitar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((match) => (
              <MatchCard key={match.matchId} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* User Predictions History */}
      {userPredictions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            Seus Palpites ({userPredictions.length})
          </h2>
          <div className="space-y-3">
            {userPredictions.map(({ prediction, match }) => (
              <div
                key={prediction.id}
                className="rounded-xl bg-card-bg border border-card-border p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <LocalTime date={match.matchDate} format="datetime" className="text-xs text-muted" />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      match.status === "finished"
                        ? "bg-card-border text-muted"
                        : "bg-accent-purple/20 text-accent-purple"
                    }`}
                  >
                    {match.status === "finished" ? "ENCERRADO" : "AGUARDANDO"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-medium">{getCountryName(match.homeTeam)}</span>
                  <div className="text-center">
                    <div className="text-xs text-muted mb-0.5">Seu palpite</div>
                    <span className="text-accent-green font-bold">
                      {prediction.predictedHomeScore}
                    </span>
                    <span className="text-muted mx-1">x</span>
                    <span className="text-accent-yellow font-bold">
                      {prediction.predictedAwayScore}
                    </span>
                  </div>
                  <span className="text-white font-medium">{getCountryName(match.awayTeam)}</span>
                </div>

                {match.status === "finished" && match.homeScore !== null && match.awayScore !== null && (
                  <div className="mt-3 pt-3 border-t border-card-border">
                    <ScoreBar
                      label="Resultado"
                      homeValue={match.homeScore}
                      awayValue={match.awayScore}
                      homeLabel={`${match.homeScore}`}
                      awayLabel={`${match.awayScore}`}
                    />
                    {prediction.predictedHomeScore === match.homeScore &&
                    prediction.predictedAwayScore === match.awayScore ? (
                      <div className="mt-2 text-center text-xs font-bold text-accent-green">
                        PLACAR EXATO!
                      </div>
                    ) : Math.sign(prediction.predictedHomeScore - prediction.predictedAwayScore) ===
                      Math.sign(match.homeScore - match.awayScore) ? (
                      <div className="mt-2 text-center text-xs font-bold text-accent-yellow">
                        VENCEDOR CORRETO
                      </div>
                    ) : (
                      <div className="mt-2 text-center text-xs text-accent-red">
                        Errou
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {userPredictions.length === 0 && !selectedMatch && upcoming.length === 0 && (
        <div className="rounded-xl bg-card-bg border border-card-border p-8 text-center text-muted">
          Nenhum palpite registrado ainda. Aguarde partidas agendadas!
        </div>
      )}
    </div>
  );
}
