"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn, StaggerChildren, StaggerItem } from "./ui/fade-in";
import { AnimatedNumber } from "./ui/animated-number";
import { Countdown } from "./ui/countdown";
import { TeamFlag } from "./ui/team-flag";
import { NotificationToggle } from "./notifications/notification-toggle";
import { MyTeamCard } from "./my-team-card";
import { getCountryCode, matchesCountryName } from "@/lib/country-codes";
import { PerformanceRing } from "./performance-ring";
import { TopScorers } from "./top-scorers";

type Match = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  matchDate: Date | string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  league: string | null;
  round: string | null;
  venue: string | null;
  cachedAt: Date | string;
};

type Prediction = {
  prediction: {
    id: string;
    predictedHomeScore: number;
    predictedAwayScore: number;
  };
  match: Match;
};

type Props = {
  user: { name: string; id: string };
  prefs: {
    favoriteCountry: string | null;
    favoriteTeam: string | null;
    favoriteLeague: string | null;
  } | null;
  upcoming: Match[];
  live: Match[];
  recent: Match[];
  stats: { total: number; exactHits: number; correctWinner: number };
  totalMatches: number;
  last5Predictions: Prediction[];
};

function HeroMatch({ match }: { match: Match }) {
  return (
    <Link href={`/dashboard/matches/${match.matchId}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden gradient-border"
      >
        <div className="card !border-0 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10px] font-bold text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Jogo do Dia
            </span>
            <Countdown
              targetDate={match.matchDate}
              className="text-xs text-accent-green"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2.5 flex-1">
              <TeamFlag name={match.homeTeam} size={48} />
              <span className="text-sm font-bold text-white text-center">{match.homeTeam}</span>
            </div>

            <div className="text-center px-4 shrink-0">
              {match.status === "finished" ? (
                <div className="text-3xl font-bold text-white">
                  {match.homeScore} <span className="text-muted">-</span> {match.awayScore}
                </div>
              ) : (
                <div className="text-xl font-mono text-muted">vs</div>
              )}
              <p className="text-[10px] text-muted mt-1">
                {new Date(match.matchDate).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2.5 flex-1">
              <TeamFlag name={match.awayTeam} size={48} />
              <span className="text-sm font-bold text-white text-center">{match.awayTeam}</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-accent-purple font-medium">Ver análise completa →</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function PredictionResult({ pred }: { pred: Prediction }) {
  const { prediction, match } = pred;
  const isExact =
    match.status === "finished" &&
    prediction.predictedHomeScore === match.homeScore &&
    prediction.predictedAwayScore === match.awayScore;
  const isCorrectWinner =
    match.status === "finished" &&
    match.homeScore !== null &&
    match.awayScore !== null &&
    Math.sign(prediction.predictedHomeScore - prediction.predictedAwayScore) ===
      Math.sign(match.homeScore - match.awayScore);

  const badge = isExact
    ? { label: "EXATO", color: "text-accent-green bg-accent-green/10" }
    : isCorrectWinner
      ? { label: "CERTO", color: "text-accent-yellow bg-accent-yellow/10" }
      : match.status === "finished"
        ? { label: "ERROU", color: "text-accent-red bg-accent-red/10" }
        : { label: "PENDENTE", color: "text-accent-purple bg-accent-purple/10" };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-white truncate flex-1 mr-3">
        {match.homeTeam} vs {match.awayTeam}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted font-mono">
          {prediction.predictedHomeScore}-{prediction.predictedAwayScore}
        </span>
        {match.status === "finished" && (
          <span className="text-xs text-muted-light font-mono">
            ({match.homeScore}-{match.awayScore})
          </span>
        )}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
          {badge.label}
        </span>
      </div>
    </div>
  );
}

export function DashboardClient({
  user,
  prefs,
  upcoming,
  live,
  recent,
  stats,
  totalMatches,
  last5Predictions,
}: Props) {
  const heroMatch = upcoming[0] || live[0];
  const favoriteCountry = prefs?.favoriteCountry;
  const favoriteMatches = favoriteCountry
    ? [...upcoming, ...recent].filter(
        (m) =>
          matchesCountryName(m.homeTeam, favoriteCountry) ||
          matchesCountryName(m.awayTeam, favoriteCountry)
      )
    : [];

  return (
    <div className="space-y-6 pb-4">
      {/* Welcome */}
      <FadeIn>
        <h1 className="text-xl md:text-2xl font-bold text-white">
          Olá, {user.name}!
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Copa do Mundo 2026 — Análises e pitacos
        </p>
      </FadeIn>

      {/* Live Alert */}
      {live.length > 0 && (
        <FadeIn delay={0.05}>
          <Link href="/dashboard/live" className="card card-interactive block p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-accent-red live-pulse" />
                <span className="text-sm font-semibold text-white">
                  {live.length} {live.length === 1 ? "jogo ao vivo" : "jogos ao vivo"}
                </span>
              </div>
              <span className="text-xs font-medium text-accent-red">Acompanhar →</span>
            </div>
          </Link>
        </FadeIn>
      )}

      {/* Two columns: My Team + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Team Card */}
        {favoriteCountry && (
          <FadeIn delay={0.1}>
            <MyTeamCard
              country={favoriteCountry}
              countryCode={getCountryCode(favoriteCountry)}
              matches={favoriteMatches}
            />
          </FadeIn>
        )}

        {/* Performance + Stats */}
        <FadeIn delay={0.15}>
          <div className="card p-5 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Seu Desempenho
            </h2>

            {stats.total > 0 ? (
              <PerformanceRing
                total={stats.total}
                correct={stats.correctWinner}
                exact={stats.exactHits}
                label="Aproveitamento"
              />
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted">Nenhum pitaco ainda</p>
                <Link href="/dashboard/matches" className="text-xs text-accent-purple mt-1 inline-block">
                  Fazer seu primeiro pitaco →
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-background p-3 text-center">
                <AnimatedNumber value={stats.total} className="text-xl font-bold text-accent-purple" />
                <p className="text-[10px] text-muted mt-0.5">Pitacos</p>
              </div>
              <div className="rounded-xl bg-background p-3 text-center">
                <AnimatedNumber value={totalMatches} className="text-xl font-bold text-accent-red" />
                <p className="text-[10px] text-muted mt-0.5">Jogos</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Hero Match */}
      {heroMatch && (
        <FadeIn delay={0.2}>
          <HeroMatch match={heroMatch} />
        </FadeIn>
      )}

      {/* Last 5 Predictions */}
      {last5Predictions.length > 0 && (
        <FadeIn delay={0.25}>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Últimos Pitacos
              </h2>
              <Link href="/dashboard/predictions" className="text-xs text-accent-purple font-medium">
                Ver todos →
              </Link>
            </div>
            {last5Predictions.map((pred) => (
              <PredictionResult key={pred.prediction.id} pred={pred} />
            ))}
          </div>
        </FadeIn>
      )}

      {/* Upcoming Matches Grid */}
      <FadeIn delay={0.3}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Próximas Análises
            </h2>
            <Link href="/dashboard/matches" className="text-xs text-accent-purple font-medium">
              Ver todas →
            </Link>
          </div>
          {upcoming.length > 0 ? (
            <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcoming.slice(0, 6).map((match) => (
                <StaggerItem key={match.matchId}>
                  <Link
                    href={`/dashboard/matches/${match.matchId}`}
                    className="card card-interactive block p-4"
                  >
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-muted">
                        {new Date(match.matchDate).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short",
                        })}
                      </span>
                      <Countdown
                        targetDate={match.matchDate}
                        className="text-accent-green text-[10px]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <TeamFlag name={match.homeTeam} size={24} />
                        <span className="text-sm text-white font-medium truncate">{match.homeTeam}</span>
                      </div>
                      <span className="text-muted text-xs px-3 shrink-0">vs</span>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                        <span className="text-sm text-white font-medium truncate text-right">{match.awayTeam}</span>
                        <TeamFlag name={match.awayTeam} size={24} />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerChildren>
          ) : (
            <div className="card p-8 text-center text-muted text-sm">
              Nenhuma partida agendada
            </div>
          )}
        </div>
      </FadeIn>

      {/* Recent Results */}
      {recent.length > 0 && (
        <FadeIn delay={0.35}>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Resultados Recentes
            </h2>
            <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recent.slice(0, 4).map((match) => (
                <StaggerItem key={match.matchId}>
                  <Link
                    href={`/dashboard/matches/${match.matchId}`}
                    className="card card-interactive block p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <TeamFlag name={match.homeTeam} size={24} />
                        <span className="text-sm text-white truncate">{match.homeTeam}</span>
                      </div>
                      <span className="text-base font-bold text-white px-3 shrink-0">
                        {match.homeScore} - {match.awayScore}
                      </span>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                        <span className="text-sm text-white truncate text-right">{match.awayTeam}</span>
                        <TeamFlag name={match.awayTeam} size={24} />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </FadeIn>
      )}

      {/* Top Scorers & Best Defenses */}
      <FadeIn delay={0.4}>
        <TopScorers />
      </FadeIn>

      {/* Notifications */}
      <FadeIn delay={0.45}>
        <NotificationToggle />
      </FadeIn>
    </div>
  );
}
