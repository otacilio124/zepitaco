"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn, StaggerChildren, StaggerItem } from "./ui/fade-in";
import { AnimatedNumber } from "./ui/animated-number";
import { Countdown } from "./ui/countdown";
import { TeamFlag } from "./ui/team-flag";
import { NotificationToggle } from "./notifications/notification-toggle";
import { MyTeamCard } from "./my-team-card";
import { matchesCountryName, getCountryCode, getCountryName } from "@/lib/country-codes";
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
  prediction: { id: string; predictedHomeScore: number; predictedAwayScore: number };
  match: Match;
};

type Props = {
  user: { name: string; id: string };
  prefs: { favoriteCountry: string | null; favoriteTeam: string | null; favoriteLeague: string | null } | null;
  upcoming: Match[];
  live: Match[];
  recent: Match[];
  stats: { total: number; exactHits: number; correctWinner: number };
  totalMatches: number;
  last5Predictions: Prediction[];
};

function MatchRow({ match }: { match: Match }) {
  return (
    <Link href={`/dashboard/matches/${match.matchId}`} className="card card-interactive block p-4">
      <div className="flex items-center justify-between text-[10px] text-muted mb-2.5">
        {match.status === "finished" ? (
          <span className="text-muted">Encerrado</span>
        ) : match.status === "live" ? (
          <span className="flex items-center gap-1 text-accent-red font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-red live-pulse" />
            AO VIVO
          </span>
        ) : (
          <Countdown targetDate={match.matchDate} className="text-accent-purple font-medium" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamFlag name={match.homeTeam} size={22} />
          <span className="text-sm text-white truncate">{getCountryName(match.homeTeam)}</span>
        </div>
        <span className="text-xs text-muted px-3 shrink-0">
          {match.status === "finished" ? (
            <span className="text-white font-semibold">{match.homeScore} - {match.awayScore}</span>
          ) : "vs"}
        </span>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm text-white truncate text-right">{getCountryName(match.awayTeam)}</span>
          <TeamFlag name={match.awayTeam} size={22} />
        </div>
      </div>
    </Link>
  );
}

function HeroMatch({ match }: { match: Match }) {
  return (
    <Link href={`/dashboard/matches/${match.matchId}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="card card-interactive p-6 border-accent-purple/20"
      >
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[10px] font-semibold text-accent-purple bg-accent-purple/10 px-2.5 py-1 rounded-full">
            DESTAQUE
          </span>
          <Countdown targetDate={match.matchDate} className="text-xs text-muted" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamFlag name={match.homeTeam} size={44} />
            <span className="text-sm font-semibold text-white">{getCountryName(match.homeTeam)}</span>
          </div>
          <span className="text-lg text-muted px-4">vs</span>
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamFlag name={match.awayTeam} size={44} />
            <span className="text-sm font-semibold text-white">{getCountryName(match.awayTeam)}</span>
          </div>
        </div>

        <p className="text-center text-[10px] text-accent-purple mt-4">Ver análise completa →</p>
      </motion.div>
    </Link>
  );
}

function PredictionItem({ pred }: { pred: Prediction }) {
  const { prediction, match } = pred;
  const isExact = match.status === "finished" && prediction.predictedHomeScore === match.homeScore && prediction.predictedAwayScore === match.awayScore;
  const isCorrect = match.status === "finished" && match.homeScore !== null && match.awayScore !== null &&
    Math.sign(prediction.predictedHomeScore - prediction.predictedAwayScore) === Math.sign(match.homeScore - match.awayScore);

  const badge = isExact
    ? { label: "EXATO", cls: "text-accent-green bg-accent-green/10" }
    : isCorrect
      ? { label: "CERTO", cls: "text-accent-yellow bg-accent-yellow/10" }
      : match.status === "finished"
        ? { label: "ERROU", cls: "text-accent-red bg-accent-red/10" }
        : { label: "PENDENTE", cls: "text-muted bg-surface-2" };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-light truncate flex-1 mr-3">
        {getCountryName(match.homeTeam)} vs {getCountryName(match.awayTeam)}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted font-mono">{prediction.predictedHomeScore}-{prediction.predictedAwayScore}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
      </div>
    </div>
  );
}

export function DashboardClient({ user, prefs, upcoming, live, recent, stats, totalMatches, last5Predictions }: Props) {
  const heroMatch = upcoming[0] || live[0];
  const favoriteCountry = prefs?.favoriteCountry;
  const favoriteMatches = favoriteCountry
    ? [...upcoming, ...recent].filter(
        (m) => matchesCountryName(m.homeTeam, favoriteCountry) || matchesCountryName(m.awayTeam, favoriteCountry)
      )
    : [];

  return (
    <div className="space-y-5 pb-4">
      <FadeIn>
        <h1 className="text-lg font-semibold text-white">Olá, {user.name}</h1>
        <p className="text-xs text-muted mt-0.5">Copa do Mundo 2026</p>
      </FadeIn>

      {live.length > 0 && (
        <FadeIn delay={0.05}>
          <Link href="/dashboard/live" className="card card-interactive block p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent-red live-pulse" />
                <span className="text-xs font-medium text-white">
                  {live.length} {live.length === 1 ? "jogo ao vivo" : "jogos ao vivo"}
                </span>
              </div>
              <span className="text-[10px] text-accent-red font-medium">Acompanhar →</span>
            </div>
          </Link>
        </FadeIn>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {favoriteCountry && (
          <FadeIn delay={0.1}>
            <MyTeamCard
              country={favoriteCountry}
              countryCode={getCountryCode(favoriteCountry)}
              matches={favoriteMatches}
            />
          </FadeIn>
        )}

        <FadeIn delay={0.15}>
          <div className="card p-5 space-y-4">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Desempenho</p>
            {stats.total > 0 ? (
              <PerformanceRing total={stats.total} correct={stats.correctWinner} exact={stats.exactHits} label="Aproveitamento" />
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-muted">Nenhum pitaco ainda</p>
                <Link href="/dashboard/matches" className="text-[10px] text-accent-purple mt-1 inline-block">Fazer primeiro pitaco →</Link>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-background p-3 text-center">
                <AnimatedNumber value={stats.total} className="text-lg font-bold text-white" />
                <p className="text-[10px] text-muted mt-0.5">Pitacos</p>
              </div>
              <div className="rounded-xl bg-background p-3 text-center">
                <AnimatedNumber value={totalMatches} className="text-lg font-bold text-white" />
                <p className="text-[10px] text-muted mt-0.5">Jogos</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {heroMatch && (
        <FadeIn delay={0.2}>
          <HeroMatch match={heroMatch} />
        </FadeIn>
      )}

      {last5Predictions.length > 0 && (
        <FadeIn delay={0.25}>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Últimos Pitacos</p>
              <Link href="/dashboard/predictions" className="text-[10px] text-accent-purple">Ver todos →</Link>
            </div>
            {last5Predictions.map((pred) => (
              <PredictionItem key={pred.prediction.id} pred={pred} />
            ))}
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.3}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Próximos Jogos</p>
            <Link href="/dashboard/matches" className="text-[10px] text-accent-purple">Ver todos →</Link>
          </div>
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {upcoming.slice(0, 6).map((match) => (
              <StaggerItem key={match.matchId}>
                <MatchRow match={match} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </FadeIn>

      {recent.length > 0 && (
        <FadeIn delay={0.35}>
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Resultados</p>
            <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {recent.slice(0, 4).map((match) => (
                <StaggerItem key={match.matchId}>
                  <MatchRow match={match} />
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.4}>
        <TopScorers />
      </FadeIn>

      <FadeIn delay={0.45}>
        <NotificationToggle />
      </FadeIn>
    </div>
  );
}
