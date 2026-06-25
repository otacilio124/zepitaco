"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";
import { getCountryName } from "@/lib/country-codes";
import { LocalTime } from "@/components/ui/local-time";

type KOMatch = {
  id: number;
  home: string | null;
  away: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  utcDate: string;
  stage: string;
};

const stageNames: Record<string, string> = {
  LAST_32: "2ª Rodada",
  LAST_16: "Oitavas",
  QUARTER_FINALS: "Quartas",
  SEMI_FINALS: "Semis",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

const stageOrder = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

function TeamSlot({
  name,
  score,
  isWinner,
  isLoser,
  border,
}: {
  name: string | null;
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  border: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-2.5 py-1.5 ${border ? "border-b border-border/50" : ""} ${isLoser ? "opacity-30" : ""}`}>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {name ? (
          <>
            <TeamFlag name={name} size={14} />
            <span className={`text-[11px] truncate ${isWinner ? "text-white font-semibold" : "text-muted-light"}`}>
              {getCountryName(name)}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-muted/50">A definir</span>
        )}
      </div>
      {score !== null ? (
        <span className={`text-[11px] font-bold ml-1 ${isWinner ? "text-white" : "text-muted"}`}>{score}</span>
      ) : name ? (
        <span className="text-[9px] text-muted ml-1">-</span>
      ) : null}
    </div>
  );
}

function BracketCard({ match, i }: { match: KOMatch; i: number }) {
  const fin = match.status === "FINISHED";
  const live = match.status === "IN_PLAY" || match.status === "PAUSED";
  const hw = fin && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const aw = fin && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
      className={`rounded-lg overflow-hidden border ${
        live ? "border-accent-red/40" : fin ? "border-border" : "border-border/40"
      } ${match.home || match.away ? "hover:border-accent-purple/30" : ""} bg-surface`}
    >
      {live && (
        <div className="flex items-center gap-1 px-2.5 py-1 bg-accent-red/10">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-red live-pulse" />
          <span className="text-[9px] font-bold text-accent-red">AO VIVO</span>
        </div>
      )}
      <div className="px-2.5 pt-1 pb-0.5">
        <LocalTime date={match.utcDate} format="datetime" className="text-[9px] text-muted" />
      </div>
      <TeamSlot name={match.home} score={match.homeScore} isWinner={hw} isLoser={fin && aw} border />
      <TeamSlot name={match.away} score={match.awayScore} isWinner={aw} isLoser={fin && hw} border={false} />
    </motion.div>
  );

  return match.home || match.away ? <Link href={`/dashboard/matches/${match.id}`}>{inner}</Link> : inner;
}

export default function BracketPage() {
  const [matches, setMatches] = useState<KOMatch[]>([]);
  const [active, setActive] = useState("LAST_32");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/football/knockout")
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stages = stageOrder.filter((s) => matches.some((m) => m.stage === s));
  const filtered = matches.filter((m) => m.stage === active);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-white">Eliminatórias</h1>
        <p className="text-xs text-muted mt-0.5">Fase final — Copa do Mundo 2026</p>
      </div>

      {/* Stage tabs - horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {stages.map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
              active === s
                ? "bg-accent-purple text-white shadow-lg shadow-accent-purple/20"
                : "bg-surface border border-border text-muted hover:text-white"
            }`}
          >
            {stageNames[s]}
          </button>
        ))}
      </div>

      {/* Matches grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 shimmer rounded-lg" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className={`grid gap-2 ${
          active === "FINAL" || active === "THIRD_PLACE"
            ? "grid-cols-1 max-w-xs"
            : active === "SEMI_FINALS"
              ? "grid-cols-1 sm:grid-cols-2 max-w-lg"
              : active === "QUARTER_FINALS"
                ? "grid-cols-2 md:grid-cols-4"
                : "grid-cols-2 md:grid-cols-4"
        }`}>
          {filtered.map((m, i) => <BracketCard key={m.id} match={m} i={i} />)}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-sm text-muted">Nenhum jogo nesta fase</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted pt-2">
        <span className="flex items-center gap-1"><span className="text-white font-semibold">Time</span> = Vencedor</span>
        <span className="flex items-center gap-1"><span className="opacity-30">Time</span> = Eliminado</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent-red live-pulse inline-block" /> Ao vivo</span>
      </div>

      <p className="text-[10px] text-muted text-center">Football data provided by Football-Data.org</p>
    </div>
  );
}
