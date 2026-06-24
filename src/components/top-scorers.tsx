"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TeamFlag } from "./ui/team-flag";

type Scorer = {
  player: { id: number; name: string; nationality: string };
  team: { id: number; name: string; shortName: string; crest: string };
  playedMatches: number;
  goals: number;
  assists: number | null;
};

type Defense = {
  name: string;
  tla: string;
  ga: number;
  mp: number;
  crest: string;
};

export function TopScorers() {
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [tab, setTab] = useState<"scorers" | "defenses">("scorers");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/football/scorers").then((r) => r.json()),
      fetch("/api/football/standings").then((r) => r.json()),
    ]).then(([scorerData, standingsData]) => {
      setScorers(scorerData.scorers || []);

      const allTeams: Defense[] = [];
      standingsData.standings
        ?.filter((s: { type: string }) => s.type === "TOTAL")
        .forEach((g: { table: { team: { shortName: string; tla: string; crest: string }; goalsAgainst: number; playedGames: number }[] }) => {
          g.table.forEach((t) => {
            if (t.playedGames > 0) {
              allTeams.push({
                name: t.team.shortName,
                tla: t.team.tla,
                ga: t.goalsAgainst,
                mp: t.playedGames,
                crest: t.team.crest,
              });
            }
          });
        });
      setDefenses(
        allTeams.sort((a, b) => a.ga / a.mp - b.ga / b.mp).slice(0, 8)
      );
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card p-5 h-64 shimmer" />;
  }

  return (
    <div className="card overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("scorers")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
            tab === "scorers" ? "text-accent-yellow" : "text-muted hover:text-white"
          }`}
        >
          Artilheiros
          {tab === "scorers" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-yellow" />
          )}
        </button>
        <button
          onClick={() => setTab("defenses")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
            tab === "defenses" ? "text-accent-green" : "text-muted hover:text-white"
          }`}
        >
          Melhores Defesas
          {tab === "defenses" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green" />
          )}
        </button>
      </div>

      {/* Content */}
      {tab === "scorers" ? (
        <div>
          {scorers.slice(0, 8).map((s, i) => (
            <motion.div
              key={s.player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0"
            >
              <span
                className={`w-6 text-center text-xs font-bold ${
                  i === 0 ? "text-accent-yellow" : i < 3 ? "text-accent-green" : "text-muted"
                }`}
              >
                {i + 1}
              </span>
              <TeamFlag name={s.team.shortName} size={20} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-white truncate block">
                  {s.player.name}
                </span>
                <span className="text-[10px] text-muted">{s.team.shortName}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <span className="text-sm font-bold text-accent-yellow">{s.goals}</span>
                  <span className="text-[9px] text-muted block">gols</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-muted-light">{s.assists || 0}</span>
                  <span className="text-[9px] text-muted block">asst</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div>
          {defenses.map((d, i) => (
            <motion.div
              key={d.tla}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0"
            >
              <span
                className={`w-6 text-center text-xs font-bold ${
                  i === 0 ? "text-accent-green" : i < 3 ? "text-accent-yellow" : "text-muted"
                }`}
              >
                {i + 1}
              </span>
              <TeamFlag name={d.name} size={20} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-white">{d.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <span className={`text-sm font-bold ${d.ga === 0 ? "text-accent-green" : "text-white"}`}>
                    {d.ga}
                  </span>
                  <span className="text-[9px] text-muted block">gols tom.</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-muted-light">{d.mp}</span>
                  <span className="text-[9px] text-muted block">jogos</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
