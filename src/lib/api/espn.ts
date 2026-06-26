const ESPN_V2 = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const ESPN_WEB = "https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world";

// ─── Types ───

export type ESPNTeam = {
  id: string;
  abbreviation: string;
  displayName: string;
  logo: string;
};

export type ESPNStandingsEntry = {
  team: ESPNTeam;
  stats: { gamesPlayed: number; wins: number; ties: number; losses: number; pointsFor: number; pointsAgainst: number; pointDifferential: number; points: number; advanced: boolean };
};

export type ESPNGroup = {
  name: string;
  entries: ESPNStandingsEntry[];
};

export type ESPNMatchEvent = {
  minute: string;
  type: string;
  player: string | null;
  playerPhoto: string | null;
  team: string | null;
};

export type ESPNMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string;
  awayAbbr: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number;
  awayScore: number;
  utcDate: string;
  status: "live" | "finished" | "scheduled";
  clock: string | null;
  period: number | null;
  statusDetail: string | null;
  venue: string | null;
  headline: string | null;
  homeRecord: string | null;
  awayRecord: string | null;
  homePossession: string;
  awayPossession: string;
  homeShots: string;
  awayShots: string;
  homeShotsOnTarget: string;
  awayShotsOnTarget: string;
  homeCorners: string;
  awayCorners: string;
  homeFouls: string;
  awayFouls: string;
  events: ESPNMatchEvent[];
  stage: string;
};

export type ESPNPlayer = {
  name: string;
  shortName: string;
  jersey: string;
  position: string;
  starter: boolean;
  subbedIn: boolean;
  photo: string | null;
};

export type ESPNLineup = {
  teamName: string;
  formation: string;
  starters: ESPNPlayer[];
  subs: ESPNPlayer[];
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

export type MatchDetailedStats = {
  home: TeamMatchStats;
  away: TeamMatchStats;
};

export type ESPNMatchDetail = {
  stats: MatchDetailedStats | null;
  homeLineup: ESPNLineup | null;
  awayLineup: ESPNLineup | null;
  events: ESPNMatchEvent[];
};

// ─── Helpers ───

function getStat(stats: { name?: string; displayValue?: string }[] | undefined, name: string): string {
  return stats?.find((s) => s.name === name)?.displayValue || "0";
}

function getStatNum(stats: { name?: string; value?: number }[] | undefined, name: string): number {
  return stats?.find((s) => s.name === name)?.value || 0;
}

function parseStat(stats: { label: string; displayValue: string }[], label: string): number {
  const stat = stats.find((s) => s.label.toLowerCase() === label.toLowerCase());
  if (!stat) return 0;
  const val = parseFloat(stat.displayValue);
  return isNaN(val) ? 0 : val;
}

function parseTeamStats(stats: { label: string; displayValue: string }[]): TeamMatchStats {
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

// ─── Scoreboard (all matches for a date) ───

export async function getESPNScoreboard(dateStr?: string): Promise<ESPNMatch[]> {
  const url = dateStr ? `${ESPN_V2}/scoreboard?dates=${dateStr}` : `${ESPN_V2}/scoreboard`;
  const res = await fetch(url, { next: { revalidate: 10 } });
  if (!res.ok) return [];
  const data = await res.json();

  return (data.events || []).map((e: any) => {
    const comp = e.competitions?.[0];
    const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
    const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
    const state = e.status?.type?.state;

    return {
      id: e.id,
      homeTeam: home?.team?.displayName || "?",
      awayTeam: away?.team?.displayName || "?",
      homeAbbr: home?.team?.abbreviation || "?",
      awayAbbr: away?.team?.abbreviation || "?",
      homeLogo: home?.team?.logo || "",
      awayLogo: away?.team?.logo || "",
      homeScore: parseInt(home?.score || "0"),
      awayScore: parseInt(away?.score || "0"),
      utcDate: e.date,
      status: state === "in" ? "live" as const : state === "post" ? "finished" as const : "scheduled" as const,
      clock: e.status?.displayClock || null,
      period: e.status?.period || null,
      statusDetail: e.status?.type?.detail || null,
      venue: e.venue?.displayName || null,
      headline: comp?.headlines?.[0]?.shortLinkText || null,
      homeRecord: home?.records?.find((r: any) => r.type === "total")?.summary || null,
      awayRecord: away?.records?.find((r: any) => r.type === "total")?.summary || null,
      homePossession: getStat(home?.statistics, "possessionPct"),
      awayPossession: getStat(away?.statistics, "possessionPct"),
      homeShots: getStat(home?.statistics, "totalShots"),
      awayShots: getStat(away?.statistics, "totalShots"),
      homeShotsOnTarget: getStat(home?.statistics, "shotsOnTarget"),
      awayShotsOnTarget: getStat(away?.statistics, "shotsOnTarget"),
      homeCorners: getStat(home?.statistics, "wonCorners"),
      awayCorners: getStat(away?.statistics, "wonCorners"),
      homeFouls: getStat(home?.statistics, "foulsCommitted"),
      awayFouls: getStat(away?.statistics, "foulsCommitted"),
      events: (comp?.details || []).map((d: any) => ({
        minute: d.clock?.displayValue || "",
        type: d.type?.text || "",
        player: d.athletesInvolved?.[0]?.displayName || null,
        playerPhoto: d.athletesInvolved?.[0]?.headshot?.href || null,
        team: d.team?.abbreviation || null,
      })),
      stage: "GROUP_STAGE",
    };
  });
}

// ─── Standings ───

export async function getESPNStandings(): Promise<ESPNGroup[]> {
  const res = await fetch(`${ESPN_WEB}/standings`, { next: { revalidate: 30 } });
  if (!res.ok) return [];
  const data = await res.json();

  return (data.children || []).map((g: any) => ({
    name: g.name || "?",
    entries: (g.standings?.entries || []).map((e: any) => ({
      team: {
        id: e.team?.id || "",
        abbreviation: e.team?.abbreviation || "?",
        displayName: e.team?.displayName || "?",
        logo: e.team?.logos?.[0]?.href || "",
      },
      stats: {
        gamesPlayed: getStatNum(e.stats, "gamesPlayed"),
        wins: getStatNum(e.stats, "wins"),
        ties: getStatNum(e.stats, "ties"),
        losses: getStatNum(e.stats, "losses"),
        pointsFor: getStatNum(e.stats, "pointsFor"),
        pointsAgainst: getStatNum(e.stats, "pointsAgainst"),
        pointDifferential: getStatNum(e.stats, "pointDifferential"),
        points: getStatNum(e.stats, "points"),
        advanced: getStatNum(e.stats, "advanced") === 1,
      },
    })),
  }));
}

// ─── All matches for date range ───

export async function getESPNAllMatches(startDate: string, endDate: string): Promise<ESPNMatch[]> {
  const all: ESPNMatch[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    const matches = await getESPNScoreboard(ds);
    all.push(...matches);
  }

  return all;
}

// ─── Match Summary (detailed stats, lineups, events) ───

export async function getESPNMatchDetail(eventId: string): Promise<ESPNMatchDetail | null> {
  try {
    const res = await fetch(`${ESPN_V2}/summary?event=${eventId}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const summary = await res.json();

    const teams = summary.boxscore?.teams;
    let stats: MatchDetailedStats | null = null;
    if (teams?.length >= 2) {
      stats = {
        home: parseTeamStats(teams[0].statistics || []),
        away: parseTeamStats(teams[1].statistics || []),
      };
    }

    const rosters = summary.rosters;
    const parseRoster = (r: any): ESPNLineup | null => {
      if (!r?.roster) return null;
      const players = r.roster.map((p: any) => ({
        name: p.athlete?.displayName || "?",
        shortName: p.athlete?.shortName || p.athlete?.displayName || "?",
        jersey: p.jersey || "?",
        position: p.position?.abbreviation || "?",
        starter: !!p.starter,
        subbedIn: !!p.subbedIn,
        photo: p.athlete?.headshot?.href || null,
      }));
      return {
        teamName: r.team?.displayName || "?",
        formation: r.formation || "4-3-3",
        starters: players.filter((p: ESPNPlayer) => p.starter),
        subs: players.filter((p: ESPNPlayer) => !p.starter && p.subbedIn),
      };
    };

    const events: ESPNMatchEvent[] = [];
    summary.keyEvents?.forEach((e: any) => {
      const type = e.type?.text || "";
      if (type.includes("Goal") || type.includes("Substitution") || type.includes("Yellow") || type.includes("Red Card")) {
        events.push({
          minute: e.clock?.displayValue || "",
          type,
          player: e.participants?.[0]?.athlete?.displayName || null,
          playerPhoto: e.participants?.[0]?.athlete?.headshot?.href || null,
          team: null,
        });
      }
    });

    return {
      stats,
      homeLineup: rosters?.[0] ? parseRoster(rosters[0]) : null,
      awayLineup: rosters?.[1] ? parseRoster(rosters[1]) : null,
      events,
    };
  } catch {
    return null;
  }
}

// ─── Find ESPN event by team names ───

export async function findESPNEvent(homeTeam: string, awayTeam: string, matchDate: Date | string): Promise<string | null> {
  const date = new Date(matchDate);
  for (const offset of [0, -1, 1]) {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    const ds = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    const matches = await getESPNScoreboard(ds);
    const match = matches.find((m) => {
      const h = homeTeam.toUpperCase().substring(0, 3);
      const a = awayTeam.toUpperCase().substring(0, 3);
      return (m.homeTeam.toUpperCase().includes(h) || m.homeAbbr.includes(h)) &&
             (m.awayTeam.toUpperCase().includes(a) || m.awayAbbr.includes(a));
    });
    if (match) return match.id;
  }
  return null;
}

// ─── Backward compat ───
export async function getESPNMatchData(homeTeam: string, awayTeam: string, matchDate: Date | string): Promise<ESPNMatchDetail | null> {
  const eventId = await findESPNEvent(homeTeam, awayTeam, matchDate);
  if (!eventId) return null;
  return getESPNMatchDetail(eventId);
}

export async function getESPNMatchStats(homeTeam: string, awayTeam: string, matchDate: Date | string): Promise<MatchDetailedStats | null> {
  const data = await getESPNMatchData(homeTeam, awayTeam, matchDate);
  return data?.stats || null;
}
