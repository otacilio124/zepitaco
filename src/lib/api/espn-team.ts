const CORE_BASE = "https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026";
const SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

let teamIdCache: Map<string, string> | null = null;

async function fetchJson<T>(url: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function loadTeamIdMap(): Promise<Map<string, string>> {
  if (teamIdCache) return teamIdCache;

  const data = await fetchJson<{ sports: { leagues: { teams: { team: { id: string; displayName: string } }[] }[] }[] }>(
    `${SITE_BASE}/teams?limit=100`,
    3600
  );

  const map = new Map<string, string>();
  const teams = data?.sports?.[0]?.leagues?.[0]?.teams || [];
  for (const t of teams) {
    map.set(t.team.displayName, t.team.id);
  }
  teamIdCache = map;
  return map;
}

export async function getESPNTeamId(teamName: string): Promise<string | null> {
  const map = await loadTeamIdMap();
  if (map.has(teamName)) return map.get(teamName)!;

  // Fuzzy fallback: case-insensitive partial match
  const lower = teamName.toLowerCase();
  for (const [name, id] of map.entries()) {
    if (name.toLowerCase() === lower || name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) {
      return id;
    }
  }
  return null;
}

export type RecentLineupPlayer = {
  name: string;
  position: string;
  jersey: string;
  photo: string | null;
};

export type RecentLineup = {
  formation: string;
  starters: RecentLineupPlayer[];
  opponent: string;
  matchDate: string;
};

/**
 * Finds the team's most recently FINISHED match and returns the actual
 * starting lineup ESPN recorded for that match — this is what we use to
 * predict the probable lineup for an upcoming game.
 */
export async function getTeamRecentLineup(teamName: string): Promise<RecentLineup | null> {
  const teamId = await getESPNTeamId(teamName);
  if (!teamId) return null;

  const eventsList = await fetchJson<{ items: { $ref: string }[] }>(
    `${CORE_BASE}/teams/${teamId}/events`,
    300
  );
  if (!eventsList?.items) return null;

  const eventIds = eventsList.items
    .map((i) => i.$ref.match(/\/events\/(\d+)/)?.[1])
    .filter((id): id is string => !!id);

  // Check each event's status/date in parallel, find the most recent finished one
  const checks = await Promise.all(
    eventIds.map(async (eventId) => {
      const summary = await fetchJson<{
        header?: {
          competitions?: {
            date?: string;
            status?: { type?: { state?: string } };
            competitors?: { homeAway?: string; team?: { id?: string; displayName?: string } }[];
          }[];
        };
      }>(`${SITE_BASE}/summary?event=${eventId}`, 120);
      const comp = summary?.header?.competitions?.[0];
      if (!comp || comp.status?.type?.state !== "post") return null;
      return { eventId, date: comp.date || "", competitors: comp.competitors || [] };
    })
  );

  const finished = checks
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const mostRecent = finished[0];
  if (!mostRecent) return null;

  const isHome = mostRecent.competitors.find((c) => c.team?.id === teamId)?.homeAway === "home";
  const opponent = mostRecent.competitors.find((c) => c.team?.id !== teamId)?.team?.displayName || "?";

  const detail = await fetchJson<{
    rosters?: {
      team?: { id?: string };
      formation?: string;
      roster?: {
        starter?: boolean;
        jersey?: string;
        position?: { abbreviation?: string };
        athlete?: { displayName?: string; headshot?: { href?: string } };
      }[];
    }[];
  }>(`${SITE_BASE}/summary?event=${mostRecent.eventId}`, 300);

  const teamRoster = detail?.rosters?.find((r) => r.team?.id === teamId) || detail?.rosters?.[isHome ? 0 : 1];
  if (!teamRoster?.roster) return null;

  const starters = teamRoster.roster
    .filter((p) => p.starter)
    .map((p) => ({
      name: p.athlete?.displayName || "?",
      position: p.position?.abbreviation || "?",
      jersey: p.jersey || "?",
      photo: p.athlete?.headshot?.href || null,
    }));

  if (starters.length === 0) return null;

  return {
    formation: teamRoster.formation || "4-3-3",
    starters,
    opponent,
    matchDate: mostRecent.date,
  };
}
