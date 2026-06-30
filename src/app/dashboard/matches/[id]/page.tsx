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
import { getESPNMatchData } from "@/lib/api/espn";
import { getPlayerPhotos } from "@/lib/api/player-photos";

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

  // Always try ESPN directly instead of trusting Neon's `status` field, which
  // lags behind (e.g. shows "live" for a match ESPN already confirmed finished
  // on penalties). ESPN is the source of truth for live/finished match data.
  const [analysis, espnData] = await Promise.all([
    getFullMatchAnalysis(matchId),
    getESPNMatchData(match.homeTeam, match.awayTeam, match.matchDate),
  ]);
  const espnStats = espnData?.stats || null;

  // Prefer ESPN's live status/score over Neon's (which can lag behind, e.g.
  // showing "live" for a match ESPN already confirmed finished on penalties).
  const displayStatus = espnData?.status ?? match.status;
  const displayHomeScore = espnData?.homeScore ?? match.homeScore;
  const displayAwayScore = espnData?.awayScore ?? match.awayScore;

  // Fetch player photos for lineups
  const allPlayerNames: string[] = [];
  if (espnData?.homeLineup) allPlayerNames.push(...espnData.homeLineup.starters.map((p) => p.name), ...espnData.homeLineup.subs.map((p) => p.name));
  if (espnData?.awayLineup) allPlayerNames.push(...espnData.awayLineup.starters.map((p) => p.name), ...espnData.awayLineup.subs.map((p) => p.name));
  if (analysis?.homePlayers) allPlayerNames.push(...analysis.homePlayers.map((p) => p.name));
  if (analysis?.awayPlayers) allPlayerNames.push(...analysis.awayPlayers.map((p) => p.name));
  const uniqueNames = [...new Set(allPlayerNames)];
  const playerPhotos = uniqueNames.length > 0 ? await getPlayerPhotos(uniqueNames) : {};
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
    <div className="space-y-6 max-w-5xl mx-auto">
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
            {displayStatus === "finished" || displayStatus === "live" ? (
              <div className="text-4xl font-bold text-white">
                {displayHomeScore} <span className="text-muted">-</span>{" "}
                {displayAwayScore}
              </div>
            ) : (
              <div className="text-3xl font-mono text-muted">vs</div>
            )}
            <span
              className={`inline-block mt-2 text-[10px] font-bold px-3 py-1 rounded-full ${
                displayStatus === "live"
                  ? "bg-accent-red text-white animate-pulse"
                  : displayStatus === "finished"
                    ? "bg-card-border text-muted"
                    : "bg-accent-purple/20 text-accent-purple"
              }`}
            >
              {displayStatus === "live"
                ? "AO VIVO"
                : displayStatus === "finished"
                  ? espnData?.statusDetail?.includes("Pens") ? "ENCERRADO (PÊNALTIS)" : "ENCERRADO"
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

          {/* Stats Comparison - ONLY real data */}
          <div className="rounded-xl bg-card-bg border border-card-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Estatísticas na Copa
              </h2>
              <span className="text-[9px] text-muted">Dados reais da competição</span>
            </div>
            <StatComparison
              stats={[
                {
                  label: "Média Gols/Jogo",
                  homeValue: analysis.analysis.homeAvgGoalsScored,
                  awayValue: analysis.analysis.awayAvgGoalsScored,
                  format: "decimal",
                },
                {
                  label: "Média Sofridos/Jogo",
                  homeValue: analysis.analysis.homeAvgGoalsConceded,
                  awayValue: analysis.analysis.awayAvgGoalsConceded,
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
                  label: "Jogos Sem Levar Gol",
                  homeValue: analysis.homeStats?.cleanSheets || 0,
                  awayValue: analysis.awayStats?.cleanSheets || 0,
                },
                {
                  label: "Jogos Disputados",
                  homeValue: analysis.homeStats?.matchesPlayed || 0,
                  awayValue: analysis.awayStats?.matchesPlayed || 0,
                },
              ]}
            />
          </div>

          {/* ESPN Detailed Stats */}
          {espnStats && (
            <div className="rounded-xl bg-card-bg border border-card-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Estatísticas da Partida
                </h2>
                <span className="text-[9px] text-muted">Fonte: ESPN</span>
              </div>
              <StatComparison
                stats={[
                  { label: "Posse de Bola (%)", homeValue: espnStats.home.possession, awayValue: espnStats.away.possession, format: "decimal" },
                  { label: "Finalizações", homeValue: espnStats.home.shots, awayValue: espnStats.away.shots },
                  { label: "Chutes no Gol", homeValue: espnStats.home.shotsOnTarget, awayValue: espnStats.away.shotsOnTarget },
                  { label: "Passes", homeValue: espnStats.home.passes, awayValue: espnStats.away.passes },
                  { label: "Precisão de Passe (%)", homeValue: espnStats.home.passAccuracy, awayValue: espnStats.away.passAccuracy },
                  { label: "Escanteios", homeValue: espnStats.home.corners, awayValue: espnStats.away.corners },
                  { label: "Faltas", homeValue: espnStats.home.fouls, awayValue: espnStats.away.fouls },
                  { label: "Impedimentos", homeValue: espnStats.home.offsides, awayValue: espnStats.away.offsides },
                  { label: "Defesas", homeValue: espnStats.home.saves, awayValue: espnStats.away.saves },
                  { label: "Desarmes", homeValue: espnStats.home.tackles, awayValue: espnStats.away.tackles },
                  { label: "Interceptações", homeValue: espnStats.home.interceptions, awayValue: espnStats.away.interceptions },
                ]}
              />
            </div>
          )}

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

          {/* ESPN Real Lineups (finished matches) */}
          {espnData && (espnData.homeLineup || espnData.awayLineup) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold text-white">Escalações Oficiais</h2>
                <span className="text-[9px] text-muted">Fonte: ESPN</span>
              </div>
              <p className="text-xs text-muted mb-4">Escalações confirmadas da partida</p>

              {/* Tactical formation with real lineups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {espnData.homeLineup && (
                  <FormationPitch
                    formation={espnData.homeLineup.formation}
                    players={espnData.homeLineup.starters.map((p) => ({ name: p.name, position: p.position, number: parseInt(p.jersey) || null }))}
                    teamName={getCountryName(match.homeTeam)}
                    side="home"
                    photos={playerPhotos}
                  />
                )}
                {espnData.awayLineup && (
                  <FormationPitch
                    formation={espnData.awayLineup.formation}
                    players={espnData.awayLineup.starters.map((p) => ({ name: p.name, position: p.position, number: parseInt(p.jersey) || null }))}
                    teamName={getCountryName(match.awayTeam)}
                    side="away"
                    photos={playerPhotos}
                  />
                )}
              </div>

              {/* Player lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[espnData.homeLineup, espnData.awayLineup].map((lineup, teamIdx) =>
                  lineup && (
                    <div key={teamIdx} className="card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TeamFlag name={teamIdx === 0 ? match.homeTeam : match.awayTeam} size={18} />
                          <h3 className="text-sm font-semibold text-white">
                            {getCountryName(teamIdx === 0 ? match.homeTeam : match.awayTeam)}
                          </h3>
                        </div>
                        <span className="text-[10px] text-accent-purple font-medium">{lineup.formation}</span>
                      </div>

                      <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Titulares</p>
                      <div className="space-y-1">
                        {lineup.starters.map((p, i) => (
                          <div key={i} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                            <div className="flex items-center gap-2">
                              {(playerPhotos[p.name] || p.photo) ? (
                                <img src={playerPhotos[p.name] || p.photo || ""} alt="" className="w-7 h-7 rounded-full object-cover object-top" />
                              ) : (
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  teamIdx === 0 ? "bg-accent-green/10 text-accent-green" : "bg-accent-purple/10 text-accent-purple"
                                }`}>
                                  {p.jersey}
                                </span>
                              )}
                              <span className="text-xs text-white">{p.name}</span>
                            </div>
                            <span className="text-[10px] text-muted">{p.position}</span>
                          </div>
                        ))}
                      </div>

                      {lineup.subs.length > 0 && (
                        <>
                          <p className="text-[10px] text-muted uppercase tracking-wider mt-3 mb-2">Substituições</p>
                          <div className="space-y-1">
                            {lineup.subs.map((p, i) => (
                              <div key={i} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-accent-green text-[10px]">↑</span>
                                  {(playerPhotos[p.name] || p.photo) ? (
                                    <img src={playerPhotos[p.name] || p.photo || ""} alt="" className="w-6 h-6 rounded-full object-cover object-top" />
                                  ) : (
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold bg-surface-2 text-muted">
                                      {p.jersey}
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-light">{p.name}</span>
                                </div>
                                <span className="text-[10px] text-muted">{p.position}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Match Events - Goals, Subs, Cards */}
          {espnData && espnData.events.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Eventos da Partida</h2>
              <div className="space-y-2">
                {espnData.events.map((evt, i) => {
                  const isGoal = evt.type.includes("Goal");
                  const isSub = evt.type.includes("Substitution");
                  const isCard = evt.type.includes("Yellow") || evt.type.includes("Red");
                  const icon = isGoal ? "⚽" : isSub ? "🔄" : isCard ? (evt.type.includes("Red") ? "🟥" : "🟨") : "•";

                  return (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0">
                      <span className="text-xs text-accent-purple font-mono w-10 shrink-0 text-right">{evt.minute}</span>
                      <span className="text-sm shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs ${isGoal ? "text-white font-semibold" : "text-muted-light"}`}>
                          {evt.type.replace("Penalty - ", "Pênalti ")}
                        </span>
                        {evt.player && (
                          <span className="text-xs text-muted ml-1">
                            — {evt.player}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Probable Lineups (matches without confirmed ESPN rosters yet) */}
          {!espnData?.homeLineup && !espnData?.awayLineup && (analysis.homePlayers.length > 0 || analysis.awayPlayers.length > 0) && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Escalações Prováveis</h2>
              <p className="text-xs text-muted mb-4">
                {analysis.homeLineupBasedOn || analysis.awayLineupBasedOn
                  ? "Baseado na titular do último jogo de cada seleção"
                  : "Baseado nos elencos convocados"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.homePlayers.length > 0 && (
                  <FormationPitch formation={analysis.homeFormation} players={analysis.homePlayers} teamName={getCountryName(match.homeTeam)} side="home" photos={playerPhotos} />
                )}
                {analysis.awayPlayers.length > 0 && (
                  <FormationPitch formation={analysis.awayFormation} players={analysis.awayPlayers} teamName={getCountryName(match.awayTeam)} side="away" photos={playerPhotos} />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {[
                  { players: analysis.homePlayers, team: match.homeTeam, basedOn: analysis.homeLineupBasedOn, colorClass: "text-accent-green bg-accent-green/10" },
                  { players: analysis.awayPlayers, team: match.awayTeam, basedOn: analysis.awayLineupBasedOn, colorClass: "text-accent-purple bg-accent-purple/10" },
                ].map(({ players, team, basedOn, colorClass }) =>
                  players.length > 0 && (
                    <div key={team} className="card p-4">
                      <h3 className="text-sm font-semibold text-white mb-0.5">{getCountryName(team)} — Titulares</h3>
                      {basedOn && <p className="text-[10px] text-muted mb-2">{basedOn}</p>}
                      <div className="space-y-1">
                        {players.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${colorClass}`}>{p.number || "?"}</span>
                              <span className="text-white">{p.name}</span>
                            </div>
                            <span className="text-muted">{p.position}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
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
      {displayStatus === "scheduled" && (
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
