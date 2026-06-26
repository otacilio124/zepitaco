const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

type ESPNStat = { label: string; displayValue: string };
type ESPNTeamStats = { team: { displayName: string }; statistics: ESPNStat[] };

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

export type MatchDetailedStats = {
  home: TeamMatchStats;
  away: TeamMatchStats;
};

export type ESPNPlayer = {
  name: string;
  shortName: string;
  jersey: string;
  position: string;
  starter: boolean;
  subbedIn: boolean;
  subbedOut: boolean;
  photo: string | null;
};

export type ESPNLineup = {
  teamName: string;
  formation: string;
  starters: ESPNPlayer[];
  subs: ESPNPlayer[];
};

export type ESPNEvent = {
  minute: string;
  type: string;
  players: string[];
};

export type ESPNMatchData = {
  stats: MatchDetailedStats | null;
  homeLineup: ESPNLineup | null;
  awayLineup: ESPNLineup | null;
  events: ESPNEvent[];
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

function parseRoster(roster: {
  team?: { displayName?: string };
  formation?: string;
  roster?: {
    starter?: boolean;
    subbedIn?: boolean;
    jersey?: string;
    position?: { abbreviation?: string };
    athlete?: {
      displayName?: string;
      shortName?: string;
      headshot?: { href?: string };
    };
  }[];
}): ESPNLineup | null {
  if (!roster?.roster) return null;

  const players = roster.roster.map((p) => ({
    name: p.athlete?.displayName || "?",
    shortName: p.athlete?.shortName || p.athlete?.displayName || "?",
    jersey: p.jersey || "?",
    position: p.position?.abbreviation || "?",
    starter: !!p.starter,
    subbedIn: !!p.subbedIn,
    subbedOut: false,
    photo: p.athlete?.headshot?.href || null,
  }));

  return {
    teamName: roster.team?.displayName || "?",
    formation: roster.formation || "4-3-3",
    starters: players.filter((p) => p.starter),
    subs: players.filter((p) => !p.starter && p.subbedIn),
  };
}

function teamMatchesESPN(teamName: string, espnShortName: string): boolean {
  const t = teamName.toUpperCase();
  const e = espnShortName.toUpperCase();
  if (e.includes(t.substring(0, 3))) return true;
  const aliases: Record<string, string[]> = {
    "KOREA REPUBLIC": ["KOR"],
    "SOUTH KOREA": ["KOR"],
    "BOSNIA-H.": ["BIH", "BOS"],
    "CONGO DR": ["COD", "CON"],
    "IVORY COAST": ["CIV"],
    "CAPE VERDE": ["CPV"],
    "COSTA RICA": ["CRC", "COS"],
    "NEW ZEALAND": ["NZL", "NZ"],
    "SAUDI ARABIA": ["KSA", "SAU", "SA"],
    "SOUTH AFRICA": ["RSA", "SA"],
    "TRINIDAD AND TOBAGO": ["TRI", "TTO"],
    "DOMINICAN REPUBLIC": ["DOM"],
    "UNITED STATES": ["USA"],
    USA: ["USA"],
    CURAÇAO: ["CUW", "CUR"],
    CZECHIA: ["CZE", "CZ"],
  };
  const teamAliases = aliases[t] || [];
  return teamAliases.some((a) => e.includes(a));
}

async function findESPNEventId(homeTeam: string, awayTeam: string, matchDate: Date | string): Promise<string | null> {
  const date = new Date(matchDate);

  // Try the match date and adjacent dates (timezone offset can shift the day)
  for (const offset of [0, -1, 1]) {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    const dateStr = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");

    const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${dateStr}`, { next: { revalidate: 300 } });
    if (!res.ok) continue;

    const data = await res.json();
    const event = data.events?.find((e: { shortName: string; competitions?: { competitors?: { team?: { abbreviation?: string } }[] }[] }) => {
      const sn = e.shortName.toUpperCase();
      if (teamMatchesESPN(homeTeam, sn) && teamMatchesESPN(awayTeam, sn)) return true;
      const teams = e.competitions?.[0]?.competitors?.map((c) => c.team?.abbreviation?.toUpperCase() || "") || [];
      return teams.some((t) => teamMatchesESPN(homeTeam, t)) && teams.some((t) => teamMatchesESPN(awayTeam, t));
    });

    if (event) return event.id;
  }

  return null;
}

export async function getESPNMatchData(
  homeTeam: string,
  awayTeam: string,
  matchDate: Date | string
): Promise<ESPNMatchData | null> {
  try {
    const eventId = await findESPNEventId(homeTeam, awayTeam, matchDate);
    if (!eventId) return null;

    const res = await fetch(`${ESPN_BASE}/summary?event=${eventId}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;

    const summary = await res.json();

    // Stats
    const teams = summary.boxscore?.teams;
    let stats: MatchDetailedStats | null = null;
    if (teams?.length >= 2) {
      stats = {
        home: parseTeamStats(teams[0].statistics || []),
        away: parseTeamStats(teams[1].statistics || []),
      };
    }

    // Lineups
    const rosters = summary.rosters;
    const homeLineup = rosters?.[0] ? parseRoster(rosters[0]) : null;
    const awayLineup = rosters?.[1] ? parseRoster(rosters[1]) : null;

    // Events (goals, subs, cards)
    const events: ESPNEvent[] = [];
    summary.keyEvents?.forEach((e: {
      clock?: { displayValue?: string };
      type?: { text?: string };
      participants?: { athlete?: { displayName?: string }; type?: string }[];
    }) => {
      const type = e.type?.text || "";
      if (type.includes("Goal") || type.includes("Substitution") || type.includes("Yellow") || type.includes("Red Card")) {
        events.push({
          minute: e.clock?.displayValue || "",
          type,
          players: e.participants?.map((p) => p.athlete?.displayName || "").filter(Boolean) || [],
        });
      }
    });

    return { stats, homeLineup, awayLineup, events };
  } catch {
    return null;
  }
}

// Keep backward compatible
export async function getESPNMatchStats(
  homeTeam: string,
  awayTeam: string,
  matchDate: Date | string
): Promise<MatchDetailedStats | null> {
  const data = await getESPNMatchData(homeTeam, awayTeam, matchDate);
  return data?.stats || null;
}
