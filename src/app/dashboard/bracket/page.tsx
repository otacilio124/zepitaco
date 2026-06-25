"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

type GroupEntry = {
  position: number;
  team: string;
  tla: string;
  points: number;
  played: number;
  gd: number;
  qualified: boolean;
};

type GroupData = {
  group: string;
  table: GroupEntry[];
};

const stageNames: Record<string, string> = {
  LAST_32: "2ª Rodada",
  LAST_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinais",
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
    <div className={`flex items-center justify-between px-2.5 py-2 ${border ? "border-b border-border/40" : ""} ${isLoser ? "opacity-25" : ""}`}>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {name ? (
          <>
            <TeamFlag name={name} size={14} />
            <span className={`text-[11px] truncate ${isWinner ? "text-white font-semibold" : "text-muted-light"}`}>
              {getCountryName(name)}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-muted/40 italic">A definir</span>
        )}
      </div>
      {score !== null && (
        <span className={`text-[11px] font-bold ml-1 ${isWinner ? "text-white" : "text-muted"}`}>{score}</span>
      )}
    </div>
  );
}

function BracketCard({ match, i }: { match: KOMatch; i: number }) {
  const fin = match.status === "FINISHED";
  const live = match.status === "IN_PLAY" || match.status === "PAUSED";
  const hw = fin && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const aw = fin && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;
  const hasTeams = match.home || match.away;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className={`rounded-lg overflow-hidden border transition-all ${
        live ? "border-accent-red/50 shadow-lg shadow-accent-red/10" : fin ? "border-border" : "border-border/30"
      } ${hasTeams ? "hover:border-accent-purple/40" : ""} bg-surface`}
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

  return hasTeams ? <Link href={`/dashboard/matches/${match.id}`}>{inner}</Link> : inner;
}

function GroupFight({ group }: { group: GroupData }) {
  const letter = group.group.replace("GROUP_", "");
  const top2 = group.table.slice(0, 2);
  const allPlayed3 = group.table.every((t) => t.played >= 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border/30 bg-surface p-2.5"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[9px] font-bold text-accent-purple bg-accent-purple/10 px-1.5 py-0.5 rounded">
          {letter}
        </span>
        {allPlayed3 ? (
          <span className="text-[9px] text-accent-green font-medium">Definido</span>
        ) : (
          <span className="text-[9px] text-accent-yellow font-medium">Em disputa</span>
        )}
      </div>
      {group.table.map((entry, i) => {
        const isQualifying = i < 2;
        return (
          <div
            key={entry.tla}
            className={`flex items-center justify-between py-1 ${i < group.table.length - 1 ? "border-b border-border/20" : ""} ${
              !isQualifying ? "opacity-30" : ""
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] w-3 text-center ${isQualifying ? "text-accent-green font-bold" : "text-muted"}`}>
                {i + 1}
              </span>
              <TeamFlag name={entry.team} size={12} />
              <span className={`text-[10px] ${isQualifying ? "text-white" : "text-muted"}`}>
                {getCountryName(entry.team)}
              </span>
            </div>
            <span className={`text-[10px] font-bold ${isQualifying ? "text-white" : "text-muted"}`}>
              {entry.points}pts
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}

export default function BracketPage() {
  const [matches, setMatches] = useState<KOMatch[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [groupsFinished, setGroupsFinished] = useState(false);
  const [active, setActive] = useState("LAST_32");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/football/knockout")
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches || []);
        setGroups(data.groups || []);
        setGroupsFinished(data.groupsFinished || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stages = stageOrder.filter((s) => matches.some((m) => m.stage === s));
  const filtered = matches.filter((m) => m.stage === active);
  const unfinishedGroups = groups.filter((g) => g.table.some((t) => t.played < 3));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-white">Eliminatórias</h1>
        <p className="text-xs text-muted mt-0.5">Copa do Mundo 2026 — Da 2ª rodada à Final</p>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {stages.map((s) => {
          const count = matches.filter((m) => m.stage === s).length;
          const hasTeams = matches.filter((m) => m.stage === s).some((m) => m.home || m.away);
          return (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                active === s
                  ? "bg-accent-purple text-white shadow-lg shadow-accent-purple/20"
                  : "bg-surface border border-border text-muted hover:text-white"
              }`}
            >
              {stageNames[s]}
              <span className={`text-[9px] ${active === s ? "text-white/60" : "text-muted/60"}`}>
                {count}
              </span>
              {!hasTeams && active !== s && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent-yellow/60" />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 shimmer rounded-lg" />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Group fight context for LAST_32 */}
            {active === "LAST_32" && !groupsFinished && unfinishedGroups.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold text-accent-yellow">Disputando vaga</span>
                  <span className="text-[10px] text-muted">· Grupos ainda em andamento</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {unfinishedGroups.map((g) => (
                    <GroupFight key={g.group} group={g} />
                  ))}
                </div>
              </div>
            )}

            {/* Stage header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold text-accent-purple">{stageNames[active]}</span>
              <span className="text-[10px] text-muted">· {filtered.length} jogos</span>
              {filtered.every((m) => !m.home && !m.away) && (
                <span className="text-[10px] text-accent-yellow">· Times a definir</span>
              )}
            </div>

            {/* Matches grid */}
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

            {/* Flow indicator */}
            {active !== "FINAL" && active !== "THIRD_PLACE" && (
              <div className="flex items-center justify-center gap-2 mt-4 text-muted">
                <span className="text-[10px]">Vencedores avançam para</span>
                <button
                  onClick={() => {
                    const nextIdx = stageOrder.indexOf(active) + 1;
                    if (nextIdx < stageOrder.length) setActive(stageOrder[nextIdx]);
                  }}
                  className="text-[10px] text-accent-purple font-medium hover:underline"
                >
                  {stageNames[stageOrder[stageOrder.indexOf(active) + 1]] || "próxima fase"} →
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted pt-2">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
          Classificado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-yellow" />
          Em disputa
        </span>
        <span className="flex items-center gap-1">
          <span className="opacity-25">Time</span> = Eliminado
        </span>
      </div>

      <p className="text-[10px] text-muted text-center">Football data provided by Football-Data.org</p>
    </div>
  );
}
