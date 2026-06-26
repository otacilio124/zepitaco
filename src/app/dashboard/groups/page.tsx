"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { getCountryName } from "@/lib/country-codes";

type Entry = {
  team: { id: string; abbreviation: string; displayName: string; logo: string };
  stats: { gamesPlayed: number; wins: number; ties: number; losses: number; pointsFor: number; pointsAgainst: number; pointDifferential: number; points: number; advanced: boolean };
};

type Group = {
  name: string;
  entries: Entry[];
  finished?: boolean;
};

function GroupTable({ group, index }: { group: Group; index: number }) {
  const letter = group.name.replace("Group ", "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-xs font-bold text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded-full">{letter}</span>
        <span className="text-sm lg:text-base font-bold text-white">{group.name}</span>
      </div>

      <div className="grid grid-cols-[1fr_28px_28px_28px_28px_28px_36px] md:grid-cols-[1fr_36px_36px_36px_36px_36px_44px] gap-0 px-3 md:px-4 py-2 text-[9px] md:text-[10px] lg:text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
        <span>Seleção</span>
        <span className="text-center">J</span>
        <span className="text-center">V</span>
        <span className="text-center">E</span>
        <span className="text-center">D</span>
        <span className="text-center">SG</span>
        <span className="text-center">Pts</span>
      </div>

      {group.entries.map((entry, i) => {
        const qualifies = entry.stats.advanced || i < 2;
        const gd = entry.stats.pointDifferential;
        return (
          <div
            key={entry.team.id}
            className={`grid grid-cols-[1fr_28px_28px_28px_28px_28px_36px] md:grid-cols-[1fr_36px_36px_36px_36px_36px_44px] gap-0 px-3 md:px-4 py-2.5 items-center border-b border-border last:border-0 ${
              qualifies ? "bg-accent-green/[0.03]" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              {qualifies && <span className="h-1.5 w-1.5 rounded-full bg-accent-green shrink-0" />}
              {!qualifies && <span className="h-1.5 w-1.5 shrink-0" />}
              {entry.team.logo && (
                <Image src={entry.team.logo} alt="" width={20} height={20} className="rounded-sm object-contain shrink-0" unoptimized />
              )}
              <span className="text-xs lg:text-sm font-medium text-white truncate">
                {getCountryName(entry.team.displayName)}
              </span>
            </div>
            <span className="text-xs lg:text-sm text-muted text-center">{entry.stats.gamesPlayed}</span>
            <span className="text-xs lg:text-sm text-accent-green text-center">{entry.stats.wins}</span>
            <span className="text-xs lg:text-sm text-accent-yellow text-center">{entry.stats.ties}</span>
            <span className="text-xs lg:text-sm text-accent-red text-center">{entry.stats.losses}</span>
            <span className={`text-xs lg:text-sm text-center ${gd > 0 ? "text-accent-green" : gd < 0 ? "text-accent-red" : "text-muted"}`}>
              {gd > 0 ? `+${gd}` : gd}
            </span>
            <span className="text-sm lg:text-base font-bold text-white text-center">{entry.stats.points}</span>
          </div>
        );
      })}
    </motion.div>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/football/standings")
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.groups || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-white">Fase de Grupos</h1>
        <p className="text-xs lg:text-sm text-muted mt-1">Copa do Mundo 2026 — Classificação atualizada</p>
      </div>

      <div className="flex items-center gap-3 text-[10px] lg:text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-green" />
          <span>Classifica</span>
        </div>
        <span>J = Jogos · V = Vitórias · E = Empates · D = Derrotas · SG = Saldo</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="card h-48 shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((g, i) => <GroupTable key={g.name} group={g} index={i} />)}
        </div>
      )}

      <p className="text-[10px] lg:text-xs text-muted text-center">Dados fornecidos por ESPN</p>
    </div>
  );
}
