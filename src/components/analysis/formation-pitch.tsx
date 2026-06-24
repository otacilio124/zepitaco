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
};

function parseFormation(formation: string): number[] {
  return formation.split("-").map(Number);
}

function getPositionLabel(pos: string): string {
  const map: Record<string, string> = {
    GK: "GOL", ST: "ATA", CF: "ATA", LW: "PE", RW: "PD",
    AM: "MEI", CM: "MEI", CDM: "VOL", LM: "ME", RM: "MD",
    CB: "ZAG", LB: "LE", RB: "LD",
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

export function FormationPitch({ formation, players, teamName, side }: FormationPitchProps) {
  const rows = mapPlayersToFormation(formation, players);
  const displayRows = side === "home" ? rows : [...rows].reverse();

  return (
    <div className="rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-card-border/50">
        <span className="text-xs font-bold text-white">{teamName}</span>
        <span className="text-xs text-muted ml-2">{formation}</span>
      </div>
      <div
        className="relative p-3"
        style={{
          background: "linear-gradient(180deg, #1a4d2e 0%, #1a5c32 50%, #1a4d2e 100%)",
          minHeight: 320,
        }}
      >
        {/* Field lines */}
        <div className="absolute inset-3 border border-white/20 rounded" />
        <div className="absolute left-3 right-3 top-1/2 h-px bg-white/20" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/20 rounded-full" />

        <div className="relative flex flex-col justify-between" style={{ minHeight: 300 }}>
          {displayRows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-around items-center py-1">
              {row.map((player, pIdx) => (
                <div key={pIdx} className="flex flex-col items-center gap-0.5 w-16">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    side === "home"
                      ? "bg-accent-green text-black"
                      : "bg-accent-purple text-white"
                  }`}>
                    {player.number || "?"}
                  </div>
                  <span className="text-[9px] text-white font-medium text-center leading-tight truncate w-full">
                    {player.name.split(" ").slice(-1)[0]}
                  </span>
                  <span className="text-[8px] text-white/50">
                    {getPositionLabel(player.position)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
