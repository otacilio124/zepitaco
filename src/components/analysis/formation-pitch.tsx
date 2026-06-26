"use client";

import Image from "next/image";

type Player = {
  name: string;
  position: string;
  number: number | null;
};

type FormationPitchProps = {
  formation: string;
  players: Player[];
  teamName: string;
  side: "home" | "away";
  photos?: Record<string, string | null>;
};

function parseFormation(formation: string): number[] {
  return formation.split("-").map(Number);
}

function isGK(pos: string): boolean {
  const p = pos.toUpperCase();
  return p === "GK" || p === "G" || p === "GOL";
}

function getPositionLabel(pos: string): string {
  const p = pos.toUpperCase();
  if (isGK(p)) return "GOL";
  const map: Record<string, string> = {
    ST: "ATA", CF: "ATA", F: "ATA", LW: "PE", RW: "PD", LF: "PE", RF: "PD",
    "CF-L": "ATA", "CF-R": "ATA",
    AM: "MEI", CM: "MEI", CDM: "VOL", DM: "VOL",
    LM: "ME", RM: "MD", "AM-L": "ME", "AM-R": "MD",
    "CM-L": "MEI", "CM-R": "MEI", "DM-L": "VOL", "DM-R": "VOL",
    CB: "ZAG", LB: "LE", RB: "LD", CD: "ZAG",
    "CD-L": "ZAG", "CD-R": "ZAG", LE: "LE", LD: "LD",
    DEF: "DEF", MID: "MEI", FWD: "ATA", MF: "MEI",
  };
  return map[p] || map[pos] || pos;
}

function mapPlayersToFormation(formation: string, players: Player[]): Player[][] {
  const lines = parseFormation(formation);
  const gk = players.find((p) => isGK(p.position));
  const outfield = players.filter((p) => !isGK(p.position));

  // Use players in order — ESPN already sends them positionally ordered
  const rows: Player[][] = [[gk || { name: "GK", position: "GK", number: 1 }]];
  let idx = 0;
  for (const count of lines) {
    const row: Player[] = [];
    for (let i = 0; i < count && idx < outfield.length; i++) {
      row.push(outfield[idx++]);
    }
    rows.push(row);
  }
  return rows;
}

function PlayerDot({ player, side, photo }: { player: Player; side: "home" | "away"; photo: string | null }) {
  const lastName = player.name.split(" ").slice(-1)[0];
  return (
    <div className="flex flex-col items-center gap-0.5 w-12 sm:w-14 md:w-16 lg:w-20">
      {photo ? (
        <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
          <Image src={photo} alt={player.name} width={48} height={48} className="object-cover object-top w-full h-full" unoptimized />
        </div>
      ) : (
        <div className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white/20 ${
          side === "home" ? "bg-accent-green/80 text-black" : "bg-accent-purple/80 text-white"
        }`}>
          {player.number || "?"}
        </div>
      )}
      <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-white font-medium text-center leading-tight truncate w-full drop-shadow-sm">
        {lastName}
      </span>
      <span className="text-[6px] sm:text-[7px] md:text-[8px] lg:text-[9px] text-white/40">{getPositionLabel(player.position)}</span>
    </div>
  );
}

export function FormationPitch({ formation, players, teamName, side, photos = {} }: FormationPitchProps) {
  const rows = mapPlayersToFormation(formation, players);
  const displayRows = side === "home" ? rows : [...rows].reverse();

  return (
    <div className="rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-surface-2 flex items-center justify-between">
        <span className="text-xs font-bold text-white">{teamName}</span>
        <span className="text-[10px] text-accent-purple font-medium">{formation}</span>
      </div>
      <div
        className="relative p-2 sm:p-3 md:p-4 lg:p-5"
        style={{
          background: "linear-gradient(180deg, #14532d 0%, #166534 50%, #14532d 100%)",
        }}
      >
        <div className="absolute inset-2 sm:inset-3 md:inset-4 lg:inset-5 border border-white/15 rounded" />
        <div className="absolute left-2 right-2 sm:left-3 sm:right-3 md:left-4 md:right-4 lg:left-5 lg:right-5 top-1/2 h-px bg-white/15" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 border border-white/15 rounded-full" />

        <div className="relative flex flex-col justify-between py-2 sm:py-3 min-h-[260px] md:min-h-[320px] lg:min-h-[380px]">
          {displayRows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-around items-center py-1">
              {row.map((player, pIdx) => (
                <PlayerDot key={pIdx} player={player} side={side} photo={photos[player.name] || null} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
