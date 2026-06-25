import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMatchById, getUserPredictionForMatch } from "@/lib/queries";
import { getFullMatchAnalysis } from "@/lib/analysis-engine";
import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";
import { LocalTime } from "@/components/ui/local-time";
import { ProbabilityBar } from "@/components/analysis/probability-bar";
import { FormationPitch } from "@/components/analysis/formation-pitch";
import { TeamForm } from "@/components/analysis/team-form";
import { StatComparison } from "@/components/analysis/stat-comparison";
import { PredictionForm } from "@/components/predictions/prediction-form";
import { getCountryName } from "@/lib/country-codes";

export default async function MatchAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const matchId = Number(id);
  const match = await getMatchById(matchId);

  if (!match) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl text-white mb-2">Partida não encontrada</h1>
        <Link href="/dashboard/matches" className="text-accent-purple text-sm">
          Voltar para partidas
        </Link>
      </div>
    );
  }

  const analysis = await getFullMatchAnalysis(matchId);
  const userPrediction = await getUserPredictionForMatch(session.user.id, matchId);

  const date = match.matchDate;

  const confidenceColors: Record<string, string> = {
    high: "text-accent-green bg-accent-green/10 border-accent-green/30",
    medium: "text-accent-yellow bg-accent-yellow/10 border-accent-yellow/30",
    low: "text-accent-red bg-accent-red/10 border-accent-red/30",
  };
  const confidenceLabels: Record<string, string> = {
    high: "Alta Confiança",
    medium: "Confiança Moderada",
    low: "Baixa Confiança",
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/matches"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-white transition-colors"
      >
        ← Voltar
      </Link>

      {/* Match Header */}
      <div className="rounded-xl bg-card-bg border border-card-border p-6">
        <div className="text-center mb-4">
          <LocalTime date={date} format="full" className="text-xs text-muted capitalize" />
          <LocalTime date={date} format="time" className="text-xs text-white font-medium ml-2" />
          {match.league && (
            <span className="text-xs text-accent-purple ml-2">{match.league}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamFlag name={match.homeTeam} size={56} />
            <span className="text-lg font-bold text-white text-center">
              {getCountryName(match.homeTeam)}
            </span>
            {analysis && (
              <span className="text-xs text-muted">
                #{analysis.homeTeam.fifaRanking} FIFA
              </span>
            )}
          </div>

          <div className="text-center px-6">
            {match.status === "finished" ? (
              <div className="text-4xl font-bold text-white">
                {match.homeScore} <span className="text-muted">-</span>{" "}
                {match.awayScore}
              </div>
            ) : (
              <div className="text-3xl font-mono text-muted">vs</div>
            )}
            <span
              className={`inline-block mt-2 text-[10px] font-bold px-3 py-1 rounded-full ${
                match.status === "live"
                  ? "bg-accent-red text-white animate-pulse"
                  : match.status === "finished"
                    ? "bg-card-border text-muted"
                    : "bg-accent-purple/20 text-accent-purple"
              }`}
            >
              {match.status === "live"
                ? "AO VIVO"
                : match.status === "finished"
                  ? "ENCERRADO"
                  : "AGENDADO"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamFlag name={match.awayTeam} size={56} />
            <span className="text-lg font-bold text-white text-center">
              {getCountryName(match.awayTeam)}
            </span>
            {analysis && (
              <span className="text-xs text-muted">
                #{analysis.awayTeam.fifaRanking} FIFA
              </span>
            )}
          </div>
        </div>
      </div>

      {analysis ? (
        <>
          {/* Prediction Estimate */}
          <div className="rounded-xl bg-card-bg border border-card-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Estimativa de Placar
              </h2>
              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                  confidenceColors[analysis.analysis.confidenceLevel]
                }`}
              >
                {confidenceLabels[analysis.analysis.confidenceLevel]}
              </span>
            </div>

            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-accent-green">
                  {analysis.analysis.predictedHomeScore}
                </div>
                <div className="text-xs text-muted mt-1">{getCountryName(match.homeTeam)}</div>
              </div>
              <div className="text-2xl text-muted">x</div>
              <div className="text-center">
                <div className="text-5xl font-bold text-accent-purple">
                  {analysis.analysis.predictedAwayScore}
                </div>
                <div className="text-xs text-muted mt-1">{getCountryName(match.awayTeam)}</div>
              </div>
            </div>

            <ProbabilityBar
              homeWin={analysis.analysis.homeWinProbability}
              draw={analysis.analysis.drawProbability}
              awayWin={analysis.analysis.awayWinProbability}
              homeLabel={getCountryName(match.homeTeam)}
              awayLabel={getCountryName(match.awayTeam)}
            />
          </div>

          {/* Probable Scores */}
          {analysis.analysis.probableScores.length > 0 && (
            <div className="rounded-xl bg-card-bg border border-card-border p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Placares Mais Prováveis
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {analysis.analysis.probableScores.map((score, i) => (
                  <div
                    key={`${score.home}-${score.away}`}
                    className={`rounded-xl p-4 text-center transition-all ${
                      i === 0
                        ? "bg-accent-purple/10 border border-accent-purple/30"
                        : "bg-background border border-border"
                    }`}
                  >
                    <div className="text-2xl font-bold text-white">
                      {score.home} - {score.away}
                    </div>
                    <div className={`text-xs mt-1 ${i === 0 ? "text-accent-purple font-semibold" : "text-muted"}`}>
                      {score.probability}%
                    </div>
                    {i === 0 && (
                      <div className="text-[9px] text-accent-purple mt-0.5 font-medium">
                        MAIS PROVÁVEL
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Comparison */}
          <div className="rounded-xl bg-card-bg border border-card-border p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Comparativo Estatístico
            </h2>
            <StatComparison
              stats={[
                {
                  label: "Posse de Bola",
                  homeValue: analysis.analysis.homePossession,
                  awayValue: analysis.analysis.awayPossession,
                  format: "percent",
                },
                {
                  label: "Finalizações (est.)",
                  homeValue: analysis.analysis.homeShots,
                  awayValue: analysis.analysis.awayShots,
                  format: "decimal",
                },
                {
                  label: "Gols Marcados",
                  homeValue: analysis.homeStats?.goalsScored || 0,
                  awayValue: analysis.awayStats?.goalsScored || 0,
                },
                {
                  label: "Gols Sofridos",
                  homeValue: analysis.homeStats?.goalsConceded || 0,
                  awayValue: analysis.awayStats?.goalsConceded || 0,
                },
                {
                  label: "Clean Sheets",
                  homeValue: analysis.homeStats?.cleanSheets || 0,
                  awayValue: analysis.awayStats?.cleanSheets || 0,
                },
                {
                  label: "Precisão de Passe",
                  homeValue: analysis.homeStats?.avgPassAccuracy || 80,
                  awayValue: analysis.awayStats?.avgPassAccuracy || 80,
                  format: "percent",
                },
              ]}
            />
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-card-bg border border-card-border p-5">
              <TeamForm
                form={analysis.homeStats?.formLast5 ?? null}
                teamName={getCountryName(match.homeTeam)}
              />
            </div>
            <div className="rounded-xl bg-card-bg border border-card-border p-5">
              <TeamForm
                form={analysis.awayStats?.formLast5 ?? null}
                teamName={getCountryName(match.awayTeam)}
              />
            </div>
          </div>

          {/* Key Factors */}
          {analysis.analysis.keyFactors.length > 0 && (
            <div className="rounded-xl bg-card-bg border border-card-border p-6">
              <h2 className="text-lg font-semibold text-white mb-3">
                Fatores-Chave
              </h2>
              <ul className="space-y-2">
                {analysis.analysis.keyFactors.map((factor, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted"
                  >
                    <span className="text-accent-yellow mt-0.5">▸</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Formations */}
          {(analysis.homePlayers.length > 0 || analysis.awayPlayers.length > 0) && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Escalações {analysis.lineupSource === "api" ? "Confirmadas" : "Prováveis"}
              </h2>
              {analysis.lineupSource === "api" && (
                <p className="text-xs text-accent-green mb-4">Dados oficiais da partida</p>
              )}
              {analysis.lineupSource === "seed" && (
                <p className="text-xs text-muted mb-4">Baseado em escalações recentes</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.homePlayers.length > 0 && (
                  <FormationPitch
                    formation={analysis.homeFormation}
                    players={analysis.homePlayers}
                    teamName={getCountryName(match.homeTeam)}
                    side="home"
                  />
                )}
                {analysis.awayPlayers.length > 0 && (
                  <FormationPitch
                    formation={analysis.awayFormation}
                    players={analysis.awayPlayers}
                    teamName={getCountryName(match.awayTeam)}
                    side="away"
                  />
                )}
              </div>
            </div>
          )}

          {/* Squad Lists */}
          {(analysis.homePlayers.length > 0 || analysis.awayPlayers.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { players: analysis.homePlayers, team: match.homeTeam, rating: analysis.homeRating, colorClass: "text-accent-green bg-accent-green/10" },
                { players: analysis.awayPlayers, team: match.awayTeam, rating: analysis.awayRating, colorClass: "text-accent-purple bg-accent-purple/10" },
              ].map(
                ({ players, team, rating, colorClass }) =>
                  players.length > 0 && (
                    <div
                      key={team}
                      className="rounded-xl bg-card-bg border border-card-border p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">
                          {team} — Titulares
                        </h3>
                        {rating && (
                          <span className="text-xs font-bold text-accent-yellow">
                            Rating {rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {players.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${colorClass}`}
                              >
                                {p.number || "?"}
                              </span>
                              <span className="text-white">{p.name}</span>
                              {p.rating && (
                                <span className="text-accent-yellow text-[10px]">
                                  {p.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-muted">
                              <span>{p.position}</span>
                              {p.club && <span>· {p.club}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl bg-card-bg border border-card-border p-8 text-center">
          <p className="text-muted">
            Análise não disponível para esta partida.
          </p>
          <p className="text-xs text-muted mt-1">
            Dados detalhados disponíveis apenas para seleções da Copa do Mundo 2026.
          </p>
        </div>
      )}

      {/* User Prediction */}
      {match.status === "scheduled" && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Seu Pitaco
          </h2>
          <PredictionForm
            matchId={match.matchId}
            homeTeam={getCountryName(match.homeTeam)}
            awayTeam={getCountryName(match.awayTeam)}
            existingHome={userPrediction?.predictedHomeScore}
            existingAway={userPrediction?.predictedAwayScore}
          />
        </div>
      )}
    </div>
  );
}
