const API_TOKEN = process.env.FOOTBALL_DATA_TOKEN!;
const BASE_URL = "https://api.football-data.org/v4";
const WC_CODE = "WC";

async function apiFetch<T>(path: string, revalidate = 10): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": API_TOKEN },
    next: { revalidate },
  });

  if (res.status === 429) {
    throw new Error("Rate limited - aguarde 1 minuto");
  }

  if (!res.ok) {
    throw new Error(`Football-Data API error: ${res.status}`);
  }

  return res.json();
}

// ─── Types ───

export type FDMatch = {
  id: number;
  utcDate: string;
  status: "SCHEDULED" | "TIMED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "CANCELLED" | "SUSPENDED" | "LIVE";
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
};

type FDStanding = {
  stage: string;
  type: string;
  group: string;
  table: {
    position: number;
    team: {
      id: number;
      name: string;
      shortName: string;
      tla: string;
      crest: string;
    };
    playedGames: number;
    won: number;
    draw: number;
    lost: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
  }[];
};

type FDScorer = {
  player: {
    id: number;
    name: string;
    nationality: string;
  };
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  playedMatches: number;
  goals: number;
  assists: number | null;
};

type MatchesResponse = {
  matches: FDMatch[];
  resultSet: { count: number };
};

type StandingsResponse = {
  standings: FDStanding[];
};

type ScorersResponse = {
  scorers: FDScorer[];
};

type CompetitionResponse = {
  id: number;
  name: string;
  code: string;
  currentSeason: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
  };
};

// ─── API Functions ───

export async function getWorldCupInfo() {
  return apiFetch<CompetitionResponse>(`/competitions/${WC_CODE}`);
}

export async function getWorldCupMatches(matchday?: number, status?: string) {
  let path = `/competitions/${WC_CODE}/matches`;
  const params = new URLSearchParams();
  if (matchday) params.set("matchday", String(matchday));
  if (status) params.set("status", status);
  const qs = params.toString();
  if (qs) path += `?${qs}`;
  return apiFetch<MatchesResponse>(path);
}

export async function getWorldCupStandings() {
  return apiFetch<StandingsResponse>(`/competitions/${WC_CODE}/standings`);
}

export async function getWorldCupScorers(limit = 10) {
  return apiFetch<ScorersResponse>(`/competitions/${WC_CODE}/scorers?limit=${limit}`);
}

export async function getMatchById(matchId: number) {
  return apiFetch<FDMatch>(`/matches/${matchId}`);
}

export async function getTodayMatches() {
  const today = new Date().toISOString().split("T")[0];
  return apiFetch<MatchesResponse>(`/matches?competitions=${WC_CODE}&dateFrom=${today}&dateTo=${today}`);
}

export function mapFDStatus(status: FDMatch["status"]): string {
  const map: Record<string, string> = {
    SCHEDULED: "scheduled",
    TIMED: "scheduled",
    IN_PLAY: "live",
    LIVE: "live",
    PAUSED: "live",
    FINISHED: "finished",
    POSTPONED: "cancelled",
    CANCELLED: "cancelled",
    SUSPENDED: "cancelled",
  };
  return map[status] || "scheduled";
}
