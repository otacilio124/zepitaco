"use server";

import { db } from "../db";
import { matches } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  getWorldCupMatches,
  mapFDStatus,
  type FDMatch,
} from "./football-data";
import { getCountryCode } from "../country-codes";

function toDbMatch(match: FDMatch) {
  return {
    matchId: match.id,
    homeTeam: match.homeTeam.shortName || match.homeTeam.name,
    awayTeam: match.awayTeam.shortName || match.awayTeam.name,
    homeTeamLogo: match.homeTeam.crest,
    awayTeamLogo: match.awayTeam.crest,
    matchDate: new Date(match.utcDate),
    status: mapFDStatus(match.status),
    homeScore: match.score.fullTime.home,
    awayScore: match.score.fullTime.away,
    league: "Copa do Mundo 2026",
    round: match.group || match.stage || String(match.matchday),
    venue: null,
    leagueId: 77,
    cachedAt: new Date(),
  };
}

export async function syncAllWorldCupMatches(): Promise<number> {
  const data = await getWorldCupMatches();
  let synced = 0;

  for (const match of data.matches) {
    if (!match.homeTeam?.name || !match.awayTeam?.name) continue;

    const dbMatch = toDbMatch(match);

    const [existing] = await db
      .select()
      .from(matches)
      .where(eq(matches.matchId, match.id))
      .limit(1);

    if (existing) {
      await db.update(matches).set(dbMatch).where(eq(matches.matchId, match.id));
    } else {
      await db.insert(matches).values(dbMatch);
    }

    synced++;
  }

  return synced;
}

export async function syncLiveMatches(): Promise<number> {
  const data = await getWorldCupMatches(undefined, "IN_PLAY");
  let synced = 0;

  for (const match of data.matches) {
    const dbMatch = toDbMatch(match);
    await db.update(matches).set(dbMatch).where(eq(matches.matchId, match.id));
    synced++;
  }

  return synced;
}

export async function syncMatchesByDate(date: Date): Promise<number> {
  return syncAllWorldCupMatches();
}

export async function syncDateRange(startDate: Date, days: number): Promise<number> {
  return syncAllWorldCupMatches();
}
