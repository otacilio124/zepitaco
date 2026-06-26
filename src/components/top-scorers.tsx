"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { TeamFlag } from "./ui/team-flag";
import { getCountryName } from "@/lib/country-codes";

type Scorer = {
  player: { id: number; name: string; photo: string | null };
  team: { shortName: string; crest: string };
  playedMatches: number;
  goals: number;
  assists: number | null;
};

type Defense = { name: string; tla: string; ga: number; mp: number; crest: string };

function PlayerPhoto({ name, photo, index }: { name: string; photo: string | null; index: number }) {
  const colors = [
    "bg-accent-purple/20 text-accent-purple",
    "bg-accent-green/15 text-accent-green",
    "bg-accent-yellow/15 text-accent-yellow",
    "bg-accent-red/15 text-accent-red",
  ];

  if (photo) {
    return (
      <div className="h-10 w-10 rounded-full overflow-hidden bg-surface-2 shrink-0">
        <Image
          src={photo}
          alt={name}
          width={40}
          height={40}
          className="object-cover object-top w-full h-full"
          unoptimized
        />
      </div>
    );
  }

  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colors[index % colors.length]}`}>
      {initials}
    </div>
  );
}

export function TopScorers() {
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [tab, setTab] = useState<"scorers" | "defenses">("scorers");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/football/scorers").then((r) => r.json()),
      fetch("/api/football/standings").then((r) => r.json()),
    ]).then(([sData, stData]) => {
      setScorers(sData.scorers || []);
      const all: Defense[] = [];
      stData.standings?.filter((s: { type: string }) => s.type === "TOTAL").forEach(
        (g: { table: { team: { shortName: string; tla: string; crest: string }; goalsAgainst: number; playedGames: number }[] }) => {
          g.table.forEach((t) => {
            if (t.playedGames > 0) all.push({ name: t.team.shortName, tla: t.team.tla, ga: t.goalsAgainst, mp: t.playedGames, crest: t.team.crest });
          });
        }
      );
      setDefenses(all.sort((a, b) => a.ga / a.mp - b.ga / b.mp).slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="card h-48 shimmer" />;

  return (
    <div className="card overflow-hidden">
      <div className="flex border-b border-border">
        {[
          { key: "scorers" as const, label: "Artilheiros" },
          { key: "defenses" as const, label: "Melhores Defesas" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-widest transition-colors relative ${
              tab === t.key ? "text-white" : "text-muted hover:text-muted-light"
            }`}
          >
            {t.label}
            {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-purple" />}
          </button>
        ))}
      </div>

      <div>
        {tab === "scorers"
          ? scorers.slice(0, 10).map((s, i) => (
              <motion.div
                key={s.player.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0"
              >
                <span className={`w-5 text-center text-[10px] font-bold ${i < 3 ? "text-accent-purple" : "text-muted"}`}>
                  {i + 1}
                </span>
                <PlayerPhoto name={s.player.name} photo={s.player.photo} index={i} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-white font-medium truncate block">{s.player.name}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TeamFlag name={s.team.shortName} size={12} />
                    <span className="text-[10px] text-muted">{getCountryName(s.team.shortName)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-center">
                    <span className="text-sm font-bold text-white">{s.goals}</span>
                    <span className="text-[8px] text-muted block">gols</span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-muted-light">{s.assists || 0}</span>
                    <span className="text-[8px] text-muted block">asst</span>
                  </div>
                </div>
              </motion.div>
            ))
          : defenses.map((d, i) => (
              <motion.div
                key={d.tla}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0"
              >
                <span className={`w-5 text-center text-[10px] font-bold ${i < 3 ? "text-accent-purple" : "text-muted"}`}>
                  {i + 1}
                </span>
                <TeamFlag name={d.name} size={24} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-white font-medium">{getCountryName(d.name)}</span>
                  <span className="text-[10px] text-muted block">{d.mp} jogos</span>
                </div>
                <div className="text-center shrink-0">
                  <span className={`text-sm font-bold ${d.ga === 0 ? "text-accent-green" : "text-white"}`}>{d.ga}</span>
                  <span className="text-[8px] text-muted block">gols tom.</span>
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
