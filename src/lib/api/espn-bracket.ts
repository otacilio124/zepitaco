const CORE_BASE = "https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026";
const SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

// Official FIFA World Cup 2026 tournament stage type IDs (from ESPN Core API)
const STAGE_TYPES: { id: number; key: string }[] = [
  { id: 2, key: "LAST_32" },
  { id: 3, key: "LAST_16" },
  { id: 4, key: "QUARTER_FINALS" },
  { id: 5, key: "SEMI_FINALS" },
  { id: 6, key: "THIRD_PLACE" },
  { id: 7, key: "FINAL" },
];

export type BracketTeam = {
  name: string;
  abbreviation: string;
  logo: string | null;
  isPlaceholder: boolean;
};

export type BracketMatch = {
  id: string;
  matchNumber: number;
  stage: string;
  date: string;
  status: "live" | "finished" | "scheduled";
  clock: string | null;
  home: BracketTeam;
  away: BracketTeam;
  homeScore: number | null;
  awayScore: number | null;
  homeWinner: boolean;
  awayWinner: boolean;
};

type CoreRef = { $ref: string };

async function fetchJson<T>(url: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function extractEventId(ref: string): string | null {
  const match = ref.match(/\/events\/(\d+)/);
  return match ? match[1] : null;
}

async function getStageMatchNumbers(typeId: number): Promise<{ eventId: string; matchNumber: number }[]> {
  const list = await fetchJson<{ items: CoreRef[] }>(`${CORE_BASE}/types/${typeId}/events`, 120);
  if (!list?.items) return [];

  const results = await Promise.all(
    list.items.map(async (item) => {
      const eventId = extractEventId(item.$ref);
      if (!eventId) return null;
      const ev = await fetchJson<{ competitions: { matchNumber: number }[] }>(item.$ref, 120);
      const matchNumber = ev?.competitions?.[0]?.matchNumber;
      if (matchNumber === undefined) return null;
      return { eventId, matchNumber };
    })
  );

  return results
    .filter((r): r is { eventId: string; matchNumber: number } => r !== null)
    .sort((a, b) => a.matchNumber - b.matchNumber);
}

async function getMatchDetails(eventId: string, matchNumber: number, stage: string): Promise<BracketMatch | null> {
  const summary = await fetchJson<{
    header?: {
      competitions?: {
        date?: string;
        status?: { type?: { state?: string; detail?: string } };
        competitors?: {
          homeAway?: string;
          winner?: boolean;
          score?: string;
          team?: { displayName?: string; abbreviation?: string; logo?: string };
        }[];
      }[];
    };
  }>(`${SITE_BASE}/summary?event=${eventId}`, 30);

  const comp = summary?.header?.competitions?.[0];
  if (!comp) return null;

  const home = comp.competitors?.find((c) => c.homeAway === "home");
  const away = comp.competitors?.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const isPlaceholderTeam = (abbr?: string) =>
    !abbr || ["RD32", "R16", "QF", "SF"].includes(abbr.toUpperCase());

  const state = comp.status?.type?.state;
  const status: BracketMatch["status"] = state === "in" ? "live" : state === "post" ? "finished" : "scheduled";

  return {
    id: eventId,
    matchNumber,
    stage,
    date: comp.date || "",
    status,
    clock: comp.status?.type?.detail || null,
    home: {
      name: home.team?.displayName || "?",
      abbreviation: home.team?.abbreviation || "?",
      logo: home.team?.logo || null,
      isPlaceholder: isPlaceholderTeam(home.team?.abbreviation),
    },
    away: {
      name: away.team?.displayName || "?",
      abbreviation: away.team?.abbreviation || "?",
      logo: away.team?.logo || null,
      isPlaceholder: isPlaceholderTeam(away.team?.abbreviation),
    },
    homeScore: status !== "scheduled" ? parseInt(home.score || "0") : null,
    awayScore: status !== "scheduled" ? parseInt(away.score || "0") : null,
    homeWinner: !!home.winner,
    awayWinner: !!away.winner,
  };
}

export async function getESPNBracket(): Promise<Record<string, BracketMatch[]>> {
  const result: Record<string, BracketMatch[]> = {};

  await Promise.all(
    STAGE_TYPES.map(async ({ id, key }) => {
      const refs = await getStageMatchNumbers(id);
      const matches = await Promise.all(
        refs.map(({ eventId, matchNumber }) => getMatchDetails(eventId, matchNumber, key))
      );
      result[key] = matches.filter((m): m is BracketMatch => m !== null).sort((a, b) => a.matchNumber - b.matchNumber);
    })
  );

  return result;
}
