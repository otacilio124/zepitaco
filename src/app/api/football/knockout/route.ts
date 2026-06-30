import { NextResponse } from "next/server";
import { getESPNBracket, type BracketMatch } from "@/lib/api/espn-bracket";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";

export const revalidate = 30;

// Knockout matches exist in both ESPN (used for accurate live bracket data)
// and our Neon DB (synced from Football-Data.org, used for predictions/links).
// The two APIs use different IDs for the same match, so we resolve the Neon
// matchId by team-name pair so links like /dashboard/matches/[id] work.
async function attachNeonMatchIds(bracket: Record<string, BracketMatch[]>) {
  const allDbMatches = await db.select({
    matchId: matches.matchId,
    homeTeam: matches.homeTeam,
    awayTeam: matches.awayTeam,
  }).from(matches);

  const lookup = new Map<string, number>();
  for (const m of allDbMatches) {
    lookup.set(`${m.homeTeam}|${m.awayTeam}`, m.matchId);
  }

  for (const stageMatches of Object.values(bracket)) {
    for (const m of stageMatches) {
      if (m.home.isPlaceholder || m.away.isPlaceholder) continue;
      const id = lookup.get(`${m.home.name}|${m.away.name}`) ?? lookup.get(`${m.away.name}|${m.home.name}`);
      if (id !== undefined) m.neonMatchId = id;
    }
  }
}

export async function GET() {
  try {
    const bracket = await getESPNBracket();
    await attachNeonMatchIds(bracket);
    return NextResponse.json({ bracket });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
