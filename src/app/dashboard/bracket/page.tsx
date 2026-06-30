"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";
import { getCountryName } from "@/lib/country-codes";
import { LocalTime } from "@/components/ui/local-time";

type KOMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number;
  awayScore: number;
  utcDate: string;
  status: string;
  stage: string;
  clock: string | null;
};

const stageNames: Record<string, string> = {
  LAST_32: "2ª Rodada",
  LAST_16: "Oitavas",
  QUARTER_FINALS: "Quartas",
  SEMI_FINALS: "Semifinais",
  FINAL: "Final",
};

const stageOrder = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"];

function isPlaceholder(name: string | null | undefined): boolean {
  if (!name || name === "?") return true;
  if (/^\d/.test(name) && name.length <= 4) return true;
  return false;
}

function TeamRow({ name, logo, score, isWinner, isLoser, isLive }: {
  name: string | null; logo?: string; score: number | null; isWinner: boolean; isLoser: boolean; isLive: boolean;
}) {
  const placeholder = isPlaceholder(name);
  return (
    <div className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 ${isLoser ? "opacity-30" : ""}`}>
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {!placeholder && name ? (
          logo ? (
            <Image src={logo} alt="" width={16} height={16} className="rounded-sm object-contain shrink-0" unoptimized />
          ) : (
            <TeamFlag name={name} size={14} />
          )
        ) : (
          <span className="h-3.5 w-3.5 rounded-sm bg-border shrink-0" />
        )}
        <span className={`text-[11px] truncate ${isWinner ? "text-white font-semibold" : placeholder ? "text-muted/40 italic" : "text-muted-light"}`}>
          {placeholder ? "A definir" : getCountryName(name!)}
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

const BracketMatch = ({ match, cardRef }: { match: KOMatch; cardRef?: (el: HTMLDivElement | null) => void }) => {
  const fin = match.status === "finished";
  const live = match.status === "live";
  const hw = fin && match.homeScore > match.awayScore;
  const aw = fin && match.awayScore > match.homeScore;
  const hasTeams = !isPlaceholder(match.homeTeam) && !isPlaceholder(match.awayTeam);

  const card = (
    <div
      ref={cardRef}
      className={`w-44 sm:w-48 rounded-lg border bg-surface overflow-hidden transition-colors ${
        live ? "border-accent-red/50 shadow-md shadow-accent-red/10" : "border-border"
      } ${hasTeams ? "hover:border-accent-purple/40" : ""}`}
    >
      {live ? (
        <div className="flex items-center gap-1 px-2.5 py-1 bg-accent-red/10">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-red live-pulse" />
          <span className="text-[9px] font-bold text-accent-red">{match.clock || "AO VIVO"}</span>
        </div>
      ) : (
        <div className="px-2.5 pt-1.5">
          <LocalTime date={match.utcDate} format="datetime" className="text-[9px] text-muted" />
        </div>
      )}
      <div className="divide-y divide-border/40 mt-1">
        <TeamRow name={match.homeTeam} logo={match.homeLogo} score={fin || live ? match.homeScore : null} isWinner={hw} isLoser={fin && aw} isLive={live} />
        <TeamRow name={match.awayTeam} logo={match.awayLogo} score={fin || live ? match.awayScore : null} isWinner={aw} isLoser={fin && hw} isLive={live} />
      </div>
    </div>
  );

  return hasTeams ? <Link href={`/dashboard/matches/${match.id}`} className="block">{card}</Link> : card;
};

type Point = { x: number; y: number };
type ConnectorLine = { from: Point; to: Point; mid: number };

export default function BracketPage() {
  const [matches, setMatches] = useState<KOMatch[]>([]);
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
        setMatches((data.matches || []).filter((m: KOMatch) => m.stage !== "THIRD_PLACE"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const byStage = useCallback((s: string) => matches.filter((m) => m.stage === s), [matches]);
  const activeStages = useMemo(() => stageOrder.filter((s) => byStage(s).length > 0), [byStage]);

  const computeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0) return;

    const newLines: ConnectorLine[] = [];

    for (let i = 0; i < activeStages.length - 1; i++) {
      const currentMatches = byStage(activeStages[i]);
      const nextMatches = byStage(activeStages[i + 1]);

      for (let pair = 0; pair < nextMatches.length; pair++) {
        const m1 = currentMatches[pair * 2];
        const m2 = currentMatches[pair * 2 + 1];
        const target = nextMatches[pair];
        if (!target) continue;

        const el1 = m1 ? cardRefs.current.get(m1.id) : null;
        const el2 = m2 ? cardRefs.current.get(m2.id) : null;
        const elTarget = cardRefs.current.get(target.id);
        if (!elTarget) continue;

        const targetRect = elTarget.getBoundingClientRect();
        const targetY = targetRect.top + targetRect.height / 2 - containerRect.top;
        const targetX = targetRect.left - containerRect.left;

        if (el1) {
          const r1 = el1.getBoundingClientRect();
          newLines.push({
            from: { x: r1.right - containerRect.left, y: r1.top + r1.height / 2 - containerRect.top },
            to: { x: targetX, y: targetY },
            mid: (r1.right - containerRect.left + targetX) / 2,
          });
        }
        if (el2) {
          const r2 = el2.getBoundingClientRect();
          newLines.push({
            from: { x: r2.right - containerRect.left, y: r2.top + r2.height / 2 - containerRect.top },
            to: { x: targetX, y: targetY },
            mid: (r2.right - containerRect.left + targetX) / 2,
          });
        }
      }
    }

    setLines(newLines);
    setSvgSize({ w: container.scrollWidth, h: container.scrollHeight });
  }, [activeStages, byStage]);

  useEffect(() => {
    if (loading || matches.length === 0) return;
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
  }, [loading, matches, computeLines]);

  const hasAnyKnockout = matches.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-white">Eliminatórias</h1>
        <p className="text-xs lg:text-sm text-muted mt-0.5">Copa do Mundo 2026 — Chaveamento completo</p>
      </div>

      {loading ? (
        <div className="flex gap-8 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-6 shrink-0">
              {[1, 2].map((j) => <div key={j} className="w-48 h-16 shimmer rounded-lg" />)}
            </div>
          ))}
        </div>
      ) : hasAnyKnockout ? (
        <>
          <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <div ref={containerRef} className="relative inline-flex gap-10 md:gap-16 lg:gap-20 pb-4">
              {/* Connector lines */}
              {svgSize.w > 0 && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={svgSize.w}
                  height={svgSize.h}
                  style={{ overflow: "visible" }}
                >
                  {lines.map((line, i) => (
                    <path
                      key={i}
                      d={`M ${line.from.x} ${line.from.y} H ${line.mid} V ${line.to.y} H ${line.to.x}`}
                      fill="none"
                      stroke="var(--border-hover)"
                      strokeWidth="1.5"
                    />
                  ))}
                </svg>
              )}

              {/* Columns */}
              {activeStages.map((stage, colIndex) => {
                const stageMatches = byStage(stage);
                return (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: colIndex * 0.08 }}
                    className="flex flex-col shrink-0 relative z-[1]"
                  >
                    <div className="text-center mb-3">
                      <span className="text-[10px] font-semibold text-accent-purple uppercase tracking-wider">
                        {stageNames[stage]}
                      </span>
                      <span className="text-[9px] text-muted ml-1">({stageMatches.length})</span>
                    </div>
                    <div
                      className="flex flex-col justify-around flex-1"
                      style={{ gap: `${Math.pow(2, colIndex) * 24}px` }}
                    >
                      {stageMatches.map((m) => (
                        <BracketMatch key={m.id} match={m} cardRef={setCardRef(m.id)} />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

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

      <p className="text-[10px] lg:text-xs text-muted text-center">Dados fornecidos por ESPN</p>
    </div>
  );
}
