const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST!;
const BASE_URL = `https://${RAPIDAPI_HOST}`;

async function apiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": RAPIDAPI_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ─── Types ───

export type ApiMatch = {
  id: number;
  leagueId: number;
  time: string;
  home: {
    id: number;
    score: number | null;
    name: string;
    longName: string;
    redCards?: number;
  };
  away: {
    id: number;
    score: number | null;
    name: string;
    longName: string;
    redCards?: number;
  };
  statusId: number;
  tournamentStage: string;
  status: {
    utcTime: string;
    finished: boolean;
    started: boolean;
    cancelled: boolean;
    scoreStr: string;
    reason?: {
      short: string;
      long: string;
    };
  };
  timeTS: number;
};

type ApiLeague = {
  id: number;
  name: string;
  localizedName: string;
  ccode: string;
  logo: string;
};

export type ApiLineupPlayer = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  shirtNumber: string;
  positionId: number;
  usualPlayingPositionId: number;
  countryName: string;
  countryCode: string;
  primaryTeamId: number;
  primaryTeamName: string;
  marketValue: number;
  horizontalLayout: { x: number; y: number };
  verticalLayout: { x: number; y: number };
  performance?: {
    rating: number;
  };
};

export type ApiLineup = {
  id: number;
  name: string;
  rating: number;
  formation: string;
  starters: ApiLineupPlayer[];
  subs?: ApiLineupPlayer[];
};

export type ApiMatchDetail = {
  matchId: string;
  matchName: string;
  matchRound: string;
  leagueId: number;
  leagueName: string;
  parentLeagueId: number;
  homeTeam: { name: string; id: number };
  awayTeam: { name: string; id: number };
  matchTimeUTCDate: string;
  started: boolean;
  finished: boolean;
};

type MatchesResponse = {
  status: string;
  response: { matches: ApiMatch[] };
};

type LeaguesResponse = {
  status: string;
  response: { leagues: ApiLeague[] };
};

type LiveResponse = {
  status: string;
  response: { live: ApiMatch[] };
};

type LineupResponse = {
  status: string;
  response: { lineup: ApiLineup };
};

type MatchDetailResponse = {
  status: string;
  response: { detail: ApiMatchDetail };
};

// ─── API Functions ───

export async function getMatchesByDate(date: string): Promise<ApiMatch[]> {
  const data = await apiFetch<MatchesResponse>("football-get-matches-by-date", { date });
  return data.response?.matches ?? [];
}

export async function getAllLeagues(): Promise<ApiLeague[]> {
  const data = await apiFetch<LeaguesResponse>("football-get-all-leagues");
  return data.response?.leagues ?? [];
}

export async function getLiveMatches(): Promise<ApiMatch[]> {
  const data = await apiFetch<LiveResponse>("football-current-live");
  return data.response?.live ?? [];
}

export async function getMatchDetail(eventId: number): Promise<ApiMatchDetail | null> {
  try {
    const data = await apiFetch<MatchDetailResponse>("football-get-match-detail", {
      eventid: String(eventId),
    });
    return data.response?.detail ?? null;
  } catch {
    return null;
  }
}

export async function getHomeTeamLineup(eventId: number): Promise<ApiLineup | null> {
  try {
    const data = await apiFetch<LineupResponse>("football-get-hometeam-lineup", {
      eventid: String(eventId),
    });
    return data.response?.lineup ?? null;
  } catch {
    return null;
  }
}

export async function getAwayTeamLineup(eventId: number): Promise<ApiLineup | null> {
  try {
    const data = await apiFetch<LineupResponse>("football-get-awayteam-lineup", {
      eventid: String(eventId),
    });
    return data.response?.lineup ?? null;
  } catch {
    return null;
  }
}

export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function mapMatchStatus(match: ApiMatch): string {
  if (match.status.cancelled) return "cancelled";
  if (match.status.finished) return "finished";
  if (match.status.started) return "live";
  return "scheduled";
}
