"use client";

import Image from "next/image";
import Link from "next/link";
import { Countdown } from "./ui/countdown";
import { TeamFlag } from "./ui/team-flag";
import { motion } from "framer-motion";

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
};

type Props = {
  country: string;
  countryCode: string;
  matches: Match[];
};

export function MyTeamCard({ country, countryCode, matches }: Props) {
  const nextMatch = matches.find((m) => m.status === "scheduled");
  const lastResult = [...matches].reverse().find((m) => m.status === "finished");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl overflow-hidden gradient-border"
    >
      <div className="card !border-0 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Image
            src={`https://flagcdn.com/w80/${countryCode}.png`}
            alt={country}
            width={48}
            height={34}
            className="rounded object-cover"
            unoptimized
          />
          <div>
            <h2 className="text-base font-bold text-white">{country}</h2>
            <p className="text-xs text-muted">Sua seleção do coração</p>
          </div>
        </div>

        {/* Next match */}
        {nextMatch && (
          <Link
            href={`/dashboard/matches/${nextMatch.matchId}`}
            className="block rounded-xl bg-background/50 p-4 hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-accent-purple uppercase tracking-wider">
                Próximo Jogo
              </span>
              <Countdown
                targetDate={nextMatch.matchDate}
                className="text-xs text-accent-green"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <TeamFlag name={nextMatch.homeTeam} size={24} />
                <span className="text-sm font-semibold text-white truncate">
                  {nextMatch.homeTeam}
                </span>
              </div>
              <span className="text-muted text-sm px-3 shrink-0">vs</span>
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span className="text-sm font-semibold text-white truncate text-right">
                  {nextMatch.awayTeam}
                </span>
                <TeamFlag name={nextMatch.awayTeam} size={24} />
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-accent-purple">Ver análise →</span>
            </div>
          </Link>
        )}

        {/* Last result */}
        {lastResult && (
          <div className="rounded-xl bg-background/50 p-3">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Último Resultado
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-white">{lastResult.homeTeam}</span>
              <span className="text-sm font-bold text-white">
                {lastResult.homeScore} - {lastResult.awayScore}
              </span>
              <span className="text-xs text-white">{lastResult.awayTeam}</span>
            </div>
          </div>
        )}

        {/* All matches count */}
        <div className="text-center">
          <Link
            href="/dashboard/matches"
            className="text-xs text-muted hover:text-accent-purple transition-colors"
          >
            {matches.length} {matches.length === 1 ? "jogo" : "jogos"} encontrados →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
