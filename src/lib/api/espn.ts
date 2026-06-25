const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

type ESPNStat = {
  label: string;
  displayValue: string;
};

type ESPNTeamStats = {
  team: { displayName: string };
  statistics: ESPNStat[];
};

type ESPNSummary = {
  boxscore: {
    teams: ESPNTeamStats[];
  };
};

export type MatchDetailedStats = {
  home: TeamMatchStats;
  away: TeamMatchStats;
};

export type TeamMatchStats = {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  corners: number;
  fouls: number;
  offsides: number;
  saves: number;
  tackles: number;
  interceptions: number;
  yellowCards: number;
  redCards: number;
};

function parseStat(stats: ESPNStat[], label: string): number {
  const stat = stats.find((s) => s.label.toLowerCase() === label.toLowerCase());
  if (!stat) return 0;
  const val = parseFloat(stat.displayValue);
  return isNaN(val) ? 0 : val;
}

function parseTeamStats(stats: ESPNStat[]): TeamMatchStats {
  return {
    possession: parseStat(stats, "Possession"),
    shots: parseStat(stats, "SHOTS"),
    shotsOnTarget: parseStat(stats, "ON GOAL"),
    passes: parseStat(stats, "Passes"),
    passAccuracy: Math.round(parseStat(stats, "Pass Completion %") * 100),
    corners: parseStat(stats, "Corner Kicks"),
    fouls: parseStat(stats, "Fouls"),
    offsides: parseStat(stats, "Offsides"),
    saves: parseStat(stats, "Saves"),
    tackles: parseStat(stats, "Tackles"),
    interceptions: parseStat(stats, "Interceptions"),
    yellowCards: parseStat(stats, "Yellow Cards"),
    redCards: parseStat(stats, "Red Cards"),
  };
}

export async function getESPNMatchStats(
  homeTeam: string,
  awayTeam: string,
  matchDate: Date | string
): Promise<MatchDetailedStats | null> {
  try {
    const date = new Date(matchDate);
    const dateStr =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");

    const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${dateStr}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const data = await res.json();

    const event = data.events?.find((e: { shortName: string }) => {
      const sn = e.shortName.toUpperCase();
      const h = homeTeam.toUpperCase().substring(0, 3);
      const a = awayTeam.toUpperCase().substring(0, 3);
      return sn.includes(h) || sn.includes(a);
    });

    if (!event) return null;

    const summaryRes = await fetch(`${ESPN_BASE}/summary?event=${event.id}`, {
      next: { revalidate: 60 },
    });
    if (!summaryRes.ok) return null;

    const summary: ESPNSummary = await summaryRes.json();
    const teams = summary.boxscore?.teams;

    if (!teams || teams.length < 2) return null;

    return {
      home: parseTeamStats(teams[0].statistics || []),
      away: parseTeamStats(teams[1].statistics || []),
    };
  } catch {
    return null;
  }
}
