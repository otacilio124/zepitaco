"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";
import { getCountryName } from "@/lib/country-codes";
import { LocalTime } from "@/components/ui/local-time";

type KOMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string;
  awayAbbr: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number;
  awayScore: number;
  utcDate: string;
  status: string;
  stage: string;
  clock: string | null;
};

type ESPNTeam = { id: string; abbreviation: string; displayName: string; logo: string };
type ESPNEntry = { team: ESPNTeam; stats: { gamesPlayed: number; wins: number; ties: number; losses: number; pointsFor: number; pointsAgainst: number; pointDifferential: number; points: number; advanced: boolean } };
type ESPNGroup = { name: string; entries: ESPNEntry[]; finished?: boolean };
type QualifiedTeam = { team: string; group: string; position: number; logo: string };

const stageNames: Record<string, string> = {
  LAST_32: "2ª Rodada",
  LAST_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinais",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

const stageOrder = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

function TeamSlot({ name, logo, score, isWinner, isLoser, border }: {
  name: string | null; logo?: string; score: number | null; isWinner: boolean; isLoser: boolean; border: boolean;
}) {
  const isPlaceholder = !name || name === "?" || name.includes("3RD") || name.includes("1") && name.length <= 2;
  return (
    <div className={`flex items-center justify-between px-2.5 py-2 ${border ? "border-b border-border/40" : ""} ${isLoser ? "opacity-25" : ""}`}>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {!isPlaceholder && name ? (
          <>
            {logo ? (
              <Image src={logo} alt="" width={16} height={16} className="rounded-sm object-contain shrink-0" unoptimized />
            ) : (
              <TeamFlag name={name} size={14} />
            )}
            <span className={`text-[11px] lg:text-xs truncate ${isWinner ? "text-white font-semibold" : "text-muted-light"}`}>
              {getCountryName(name)}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-muted/40 italic">A definir</span>
        )}
      </div>
      {score !== null && score !== undefined && (
        <span className={`text-[11px] font-bold ml-1 ${isWinner ? "text-white" : "text-muted"}`}>{score}</span>
      )}
    </div>
  );
}

function BracketCard({ match, i }: { match: KOMatch; i: number }) {
  const fin = match.status === "finished";
  const live = match.status === "live";
  const hw = fin && match.homeScore > match.awayScore;
  const aw = fin && match.awayScore > match.homeScore;
  const hasTeams = match.homeTeam && match.awayTeam && match.homeTeam !== "?" && match.awayTeam !== "?";

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
          <span className="text-[9px] font-bold text-accent-red">AO VIVO {match.clock}</span>
        </div>
      )}
      <div className="px-2.5 pt-1 pb-0.5">
        <LocalTime date={match.utcDate} format="datetime" className="text-[9px] lg:text-[10px] text-muted" />
      </div>
      <TeamSlot name={match.homeTeam} logo={match.homeLogo} score={fin ? match.homeScore : null} isWinner={hw} isLoser={fin && aw} border />
      <TeamSlot name={match.awayTeam} logo={match.awayLogo} score={fin ? match.awayScore : null} isWinner={aw} isLoser={fin && hw} border={false} />
    </motion.div>
  );

  return hasTeams ? <Link href={`/dashboard/matches/${match.id}`}>{inner}</Link> : inner;
}

function QualifiedSection({ teams }: { teams: QualifiedTeam[] }) {
  if (teams.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] lg:text-xs font-semibold text-accent-green">Classificados</span>
        <span className="text-[10px] lg:text-xs text-muted">· {teams.length} seleções</span>
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {teams.map((t) => (
          <motion.div
            key={t.team}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="shrink-0 flex items-center gap-2 bg-accent-green/5 border border-accent-green/20 rounded-lg px-3 py-2"
          >
            {t.logo ? (
              <Image src={t.logo} alt="" width={16} height={16} className="rounded-sm object-contain" unoptimized />
            ) : (
              <TeamFlag name={t.team} size={16} />
            )}
            <span className="text-[11px] text-white font-medium">{getCountryName(t.team)}</span>
            <span className="text-[9px] text-muted">{t.position}º {t.group}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GroupFight({ group }: { group: ESPNGroup }) {
  const letter = group.name.replace("Group ", "");
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border/30 bg-surface p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[9px] font-bold text-accent-purple bg-accent-purple/10 px-1.5 py-0.5 rounded">{letter}</span>
        {group.finished ? (
          <span className="text-[9px] text-accent-green font-medium">Definido</span>
        ) : (
          <span className="text-[9px] text-accent-yellow font-medium">Em disputa</span>
        )}
      </div>
      {group.entries.map((entry, i) => {
        const isTop2 = i < 2;
        return (
          <div key={entry.team.id} className={`flex items-center justify-between py-1 ${i < group.entries.length - 1 ? "border-b border-border/20" : ""} ${!isTop2 ? "opacity-30" : ""}`}>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] w-3 text-center ${isTop2 ? (entry.stats.advanced ? "text-accent-green" : "text-accent-yellow") : "text-muted"} font-bold`}>
                {i + 1}
              </span>
              {entry.team.logo ? (
                <Image src={entry.team.logo} alt="" width={12} height={12} className="rounded-sm object-contain shrink-0" unoptimized />
              ) : (
                <TeamFlag name={entry.team.displayName} size={12} />
              )}
              <span className={`text-[10px] ${isTop2 ? "text-white" : "text-muted"}`}>{getCountryName(entry.team.displayName)}</span>
            </div>
            <span className={`text-[10px] font-bold ${isTop2 ? "text-white" : "text-muted"}`}>{entry.stats.points}pts</span>
          </div>
        );
      })}
    </motion.div>
  );
}

export default function BracketPage() {
  const [matches, setMatches] = useState<KOMatch[]>([]);
  const [groups, setGroups] = useState<ESPNGroup[]>([]);
  const [qualified, setQualified] = useState<QualifiedTeam[]>([]);
  const [groupsFinished, setGroupsFinished] = useState(false);
  const [active, setActive] = useState("LAST_32");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/football/knockout")
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches || []);
        setGroups(data.groups || []);
        setQualified(data.qualifiedTeams || []);
        setGroupsFinished(data.groupsFinished || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stages = stageOrder.filter((s) => matches.some((m) => m.stage === s));
  const filtered = matches.filter((m) => m.stage === active);
  const unfinishedGroups = groups.filter((g) => !g.finished);
  const finishedGroups = groups.filter((g) => g.finished);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-white">Eliminatórias</h1>
        <p className="text-xs lg:text-sm text-muted mt-0.5">Copa do Mundo 2026 — Da 2ª rodada à Final</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {stages.map((s) => {
          const count = matches.filter((m) => m.stage === s).length;
          return (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`shrink-0 px-3 py-2 rounded-lg text-[11px] lg:text-xs font-medium transition-all flex items-center gap-1.5 ${
                active === s
                  ? "bg-accent-purple text-white shadow-lg shadow-accent-purple/20"
                  : "bg-surface border border-border text-muted hover:text-white"
              }`}
            >
              {stageNames[s]}
              <span className={`text-[9px] ${active === s ? "text-white/60" : "text-muted/60"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 shimmer rounded-lg" />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {active === "LAST_32" && qualified.length > 0 && <QualifiedSection teams={qualified} />}

            {active === "LAST_32" && unfinishedGroups.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] lg:text-xs font-semibold text-accent-yellow mb-3">Disputando vaga · {unfinishedGroups.length} grupos</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {unfinishedGroups.map((g) => <GroupFight key={g.name} group={g} />)}
                </div>
              </div>
            )}

            {active === "LAST_32" && finishedGroups.length > 0 && unfinishedGroups.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] lg:text-xs font-semibold text-accent-green mb-3">Grupos encerrados</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {finishedGroups.map((g) => <GroupFight key={g.name} group={g} />)}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] lg:text-xs font-semibold text-accent-purple">{stageNames[active]}</span>
              <span className="text-[10px] lg:text-xs text-muted">· {filtered.length} jogos</span>
            </div>

            <div className={`grid gap-2 ${
              active === "FINAL" || active === "THIRD_PLACE" ? "grid-cols-1 max-w-xs"
                : active === "SEMI_FINALS" ? "grid-cols-1 sm:grid-cols-2 max-w-lg"
                : "grid-cols-2 md:grid-cols-4"
            }`}>
              {filtered.map((m, i) => <BracketCard key={m.id} match={m} i={i} />)}
            </div>

            {active !== "FINAL" && active !== "THIRD_PLACE" && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-[10px] text-muted">Vencedores avançam →</span>
                <button onClick={() => { const next = stageOrder.indexOf(active) + 1; if (next < stageOrder.length) setActive(stageOrder[next]); }}
                  className="text-[10px] text-accent-purple font-medium hover:underline">
                  {stageNames[stageOrder[stageOrder.indexOf(active) + 1]]}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="flex flex-wrap gap-3 text-[10px] lg:text-xs text-muted pt-2">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent-green" /> Classificado</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent-yellow" /> Em disputa</span>
        <span className="flex items-center gap-1"><span className="opacity-25">Time</span> = Eliminado</span>
      </div>

      <p className="text-[10px] lg:text-xs text-muted text-center">Dados fornecidos por ESPN</p>
    </div>
  );
}
