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

function getPositionLabel(pos: string): string {
  const map: Record<string, string> = {
    GK: "GOL", ST: "ATA", CF: "ATA", LW: "PE", RW: "PD",
    AM: "MEI", CM: "MEI", CDM: "VOL", LM: "ME", RM: "MD",
    CB: "ZAG", LB: "LE", RB: "LD", DEF: "DEF", MID: "MEI", FWD: "ATA",
  };
  return map[pos] || pos;
}

function mapPlayersToFormation(formation: string, players: Player[]): Player[][] {
  const lines = parseFormation(formation);
  const gk = players.find((p) => p.position === "GK");
  const outfield = players.filter((p) => p.position !== "GK");
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
    <div className="flex flex-col items-center gap-0.5 w-14 md:w-16">
      {photo ? (
        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
          <Image src={photo} alt={player.name} width={40} height={40} className="object-cover object-top w-full h-full" unoptimized />
        </div>
      ) : (
        <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white/20 ${
          side === "home" ? "bg-accent-green/80 text-black" : "bg-accent-purple/80 text-white"
        }`}>
          {player.number || "?"}
        </div>
      )}
      <span className="text-[8px] md:text-[9px] text-white font-medium text-center leading-tight truncate w-full drop-shadow-sm">
        {lastName}
      </span>
      <span className="text-[7px] text-white/40">{getPositionLabel(player.position)}</span>
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
        className="relative p-2 md:p-3"
        style={{
          background: "linear-gradient(180deg, #14532d 0%, #166534 50%, #14532d 100%)",
          minHeight: 300,
        }}
      >
        <div className="absolute inset-2 md:inset-3 border border-white/15 rounded" />
        <div className="absolute left-2 right-2 md:left-3 md:right-3 top-1/2 h-px bg-white/15" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 border border-white/15 rounded-full" />

        <div className="relative flex flex-col justify-between" style={{ minHeight: 280 }}>
          {displayRows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-around items-center py-0.5 md:py-1">
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
