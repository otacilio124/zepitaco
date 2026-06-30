"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";
import { getCountryName } from "@/lib/country-codes";
import { LocalTime } from "@/components/ui/local-time";

type BracketTeam = {
  name: string;
  abbreviation: string;
  logo: string | null;
  isPlaceholder: boolean;
};

type BracketMatch = {
  id: string;
  matchNumber: number;
  stage: string;
  date: string;
  status: "live" | "finished" | "scheduled";
  clock: string | null;
  home: BracketTeam;
  away: BracketTeam;
  homeScore: number | null;
  awayScore: number | null;
  homeWinner: boolean;
  awayWinner: boolean;
};

const stageNames: Record<string, string> = {
  LAST_32: "2ª Rodada",
  LAST_16: "Oitavas",
  QUARTER_FINALS: "Quartas",
  SEMI_FINALS: "Semifinais",
  FINAL: "Final",
};

const stageOrder = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"];

function TeamRow({ team, score, isWinner, isLoser, isLive }: {
  team: BracketTeam; score: number | null; isWinner: boolean; isLoser: boolean; isLive: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 ${isLoser ? "opacity-30" : ""}`}>
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {!team.isPlaceholder ? (
          <TeamFlag name={team.name} size={14} />
        ) : (
          <span className="h-3.5 w-3.5 rounded-sm bg-border shrink-0" />
        )}
        <span className={`text-[11px] truncate ${isWinner ? "text-white font-semibold" : team.isPlaceholder ? "text-muted/40 italic" : "text-muted-light"}`}>
          {team.isPlaceholder ? "A definir" : getCountryName(team.name)}
        </span>
      </div>
      {score !== null && (
        <span className={`text-[11px] font-bold shrink-0 ${isWinner ? "text-white" : isLive ? "text-accent-red" : "text-muted"}`}>
          {score}
        </span>
      )}
    </div>
  );
}

const BracketMatchCard = ({ match, cardRef }: { match: BracketMatch; cardRef?: (el: HTMLDivElement | null) => void }) => {
  const live = match.status === "live";
  const hasRealTeams = !match.home.isPlaceholder && !match.away.isPlaceholder;

  const card = (
    <div
      ref={cardRef}
      className={`w-44 sm:w-48 rounded-lg border bg-surface overflow-hidden transition-colors ${
        live ? "border-accent-red/50 shadow-md shadow-accent-red/10" : "border-border"
      } ${hasRealTeams ? "hover:border-accent-purple/40" : ""}`}
    >
      {live ? (
        <div className="flex items-center gap-1 px-2.5 py-1 bg-accent-red/10">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-red live-pulse" />
          <span className="text-[9px] font-bold text-accent-red">AO VIVO</span>
        </div>
      ) : (
        <div className="px-2.5 pt-1.5">
          <LocalTime date={match.date} format="datetime" className="text-[9px] text-muted" />
        </div>
      )}
      <div className="divide-y divide-border/40 mt-1">
        <TeamRow team={match.home} score={match.status !== "scheduled" ? match.homeScore : null} isWinner={match.homeWinner} isLoser={match.awayWinner} isLive={live} />
        <TeamRow team={match.away} score={match.status !== "scheduled" ? match.awayScore : null} isWinner={match.awayWinner} isLoser={match.homeWinner} isLive={live} />
      </div>
      {match.clock && match.status === "finished" && match.clock.includes("Pens") && (
        <div className="px-2.5 pb-1.5 -mt-0.5">
          <span className="text-[8px] text-accent-yellow">Pênaltis</span>
        </div>
      )}
    </div>
  );

  return hasRealTeams ? <Link href={`/dashboard/matches/${match.id}`} className="block">{card}</Link> : card;
};

type Point = { x: number; y: number };
type ConnectorLine = { from: Point; to: Point; mid: number };

export default function BracketPage() {
  const [bracket, setBracket] = useState<Record<string, BracketMatch[]>>({});
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<ConnectorLine[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setCardRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  useEffect(() => {
    fetch("/api/football/knockout")
      .then((r) => r.json())
      .then((data) => {
        setBracket(data.bracket || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeStages = stageOrder.filter((s) => (bracket[s]?.length || 0) > 0);

  const computeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0) return;

    const newLines: ConnectorLine[] = [];

    for (let i = 0; i < activeStages.length - 1; i++) {
      const current = bracket[activeStages[i]] || [];
      const next = bracket[activeStages[i + 1]] || [];

      for (let pair = 0; pair < next.length; pair++) {
        const m1 = current[pair * 2];
        const m2 = current[pair * 2 + 1];
        const target = next[pair];
        if (!target) continue;

        const elTarget = cardRefs.current.get(target.id);
        if (!elTarget) continue;
        const targetRect = elTarget.getBoundingClientRect();
        const targetY = targetRect.top + targetRect.height / 2 - containerRect.top;
        const targetX = targetRect.left - containerRect.left;

        for (const m of [m1, m2]) {
          if (!m) continue;
          const el = cardRefs.current.get(m.id);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          const fromX = r.right - containerRect.left;
          const fromY = r.top + r.height / 2 - containerRect.top;
          newLines.push({ from: { x: fromX, y: fromY }, to: { x: targetX, y: targetY }, mid: (fromX + targetX) / 2 });
        }
      }
    }

    setLines(newLines);
    setSvgSize({ w: container.scrollWidth, h: container.scrollHeight });
  }, [activeStages, bracket]);

  useEffect(() => {
    if (loading || Object.keys(bracket).length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    computeLines();
    const retries = [50, 150, 350, 700].map((ms) => setTimeout(computeLines, ms));
    const observer = new ResizeObserver(() => computeLines());
    observer.observe(container);
    window.addEventListener("resize", computeLines);

    return () => {
      retries.forEach(clearTimeout);
      observer.disconnect();
      window.removeEventListener("resize", computeLines);
    };
  }, [loading, bracket, computeLines]);

  const thirdPlace = bracket.THIRD_PLACE?.[0];
  const hasData = activeStages.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-white">Eliminatórias</h1>
        <p className="text-xs lg:text-sm text-muted mt-0.5">Copa do Mundo 2026 — Chaveamento oficial FIFA</p>
      </div>

      {loading ? (
        <div className="flex gap-8 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-6 shrink-0">
              {[1, 2].map((j) => <div key={j} className="w-48 h-16 shimmer rounded-lg" />)}
            </div>
          ))}
        </div>
      ) : hasData ? (
        <>
          <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <div ref={containerRef} className="relative inline-flex gap-10 md:gap-16 lg:gap-20 pb-4">
              {svgSize.w > 0 && (
                <svg className="absolute inset-0 pointer-events-none" width={svgSize.w} height={svgSize.h} style={{ overflow: "visible" }}>
                  {lines.map((line, i) => (
                    <path key={i} d={`M ${line.from.x} ${line.from.y} H ${line.mid} V ${line.to.y} H ${line.to.x}`} fill="none" stroke="var(--border-hover)" strokeWidth="1.5" />
                  ))}
                </svg>
              )}

              {activeStages.map((stage, colIndex) => {
                const stageMatches = bracket[stage] || [];
                return (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: colIndex * 0.08 }}
                    className="flex flex-col shrink-0 relative z-[1]"
                  >
                    <div className="text-center mb-3">
                      <span className="text-[10px] font-semibold text-accent-purple uppercase tracking-wider">{stageNames[stage]}</span>
                      <span className="text-[9px] text-muted ml-1">({stageMatches.length})</span>
                    </div>
                    <div className="flex flex-col justify-around flex-1" style={{ gap: `${Math.pow(2, colIndex) * 24}px` }}>
                      {stageMatches.map((m) => (
                        <BracketMatchCard key={m.id} match={m} cardRef={setCardRef(m.id)} />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {thirdPlace && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <span className="text-[10px] font-semibold text-accent-yellow uppercase tracking-wider">3º Lugar</span>
              <BracketMatchCard match={thirdPlace} />
            </div>
          )}

          <p className="text-[10px] text-muted text-center md:hidden">← Arraste para o lado para ver todas as fases →</p>
        </>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-sm text-white">As eliminatórias ainda não começaram</p>
          <p className="text-xs text-muted mt-1">Os confrontos aparecem aqui assim que forem definidos</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-[10px] lg:text-xs text-muted pt-2">
        <span className="flex items-center gap-1"><span className="text-white font-semibold">Time</span> = Vencedor</span>
        <span className="flex items-center gap-1"><span className="opacity-30">Time</span> = Eliminado</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent-red live-pulse inline-block" /> Ao vivo</span>
      </div>

      <p className="text-[10px] lg:text-xs text-muted text-center">Dados oficiais ESPN — chaveamento FIFA Copa do Mundo 2026</p>
    </div>
  );
}
