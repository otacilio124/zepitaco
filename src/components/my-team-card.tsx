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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="card p-5 space-y-4 border-accent-purple/15"
    >
      <div className="flex items-center gap-3">
        <Image
          src={`https://flagcdn.com/w80/${countryCode}.png`}
          alt={country}
          width={40}
          height={28}
          className="rounded object-cover"
          unoptimized
        />
        <div>
          <h2 className="text-sm font-semibold text-white">{country}</h2>
          <p className="text-[10px] text-muted">Sua seleção</p>
        </div>
      </div>

      {nextMatch && (
        <Link
          href={`/dashboard/matches/${nextMatch.matchId}`}
          className="block rounded-xl bg-background p-3.5 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-accent-purple">Próximo Jogo</span>
            <Countdown targetDate={nextMatch.matchDate} className="text-[10px] text-muted" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamFlag name={nextMatch.homeTeam} size={20} />
              <span className="text-xs text-white truncate">{nextMatch.homeTeam}</span>
            </div>
            <span className="text-xs text-muted px-2">vs</span>
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-xs text-white truncate text-right">{nextMatch.awayTeam}</span>
              <TeamFlag name={nextMatch.awayTeam} size={20} />
            </div>
          </div>
        </Link>
      )}

      {lastResult && (
        <div className="rounded-xl bg-background p-3">
          <span className="text-[10px] text-muted">Último resultado</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-white">{lastResult.homeTeam}</span>
            <span className="text-xs font-semibold text-white">{lastResult.homeScore} - {lastResult.awayScore}</span>
            <span className="text-xs text-white">{lastResult.awayTeam}</span>
          </div>
        </div>
      )}

      <Link href="/dashboard/matches" className="block text-center text-[10px] text-muted hover:text-accent-purple transition-colors">
        {matches.length} {matches.length === 1 ? "jogo" : "jogos"} →
      </Link>
    </motion.div>
  );
}
