import { NextResponse } from "next/server";
import { getWorldCupMatches } from "@/lib/api/football-data";
import { syncAllWorldCupMatches } from "@/lib/api/sync";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const revalidate = 10;

let lastDbSync = 0;
const DB_SYNC_INTERVAL = 5 * 60 * 1000;

export async function GET() {
  try {
    const data = await getWorldCupMatches();

    const allMatches = data.matches
      .filter((m) => m.homeTeam?.name && m.awayTeam?.name)
      .map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam.shortName,
        awayTeam: m.awayTeam.shortName,
        homeCrest: m.homeTeam.crest,
        awayCrest: m.awayTeam.crest,
        homeTla: m.homeTeam.tla,
        awayTla: m.awayTeam.tla,
        utcDate: m.utcDate,
        status: m.status,
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
        group: m.group,
        matchday: m.matchday,
      }));

    const now = Date.now();
    const live = allMatches.filter((m) => m.status === "IN_PLAY" || m.status === "PAUSED");
    const today = allMatches.filter((m) => {
      const d = new Date(m.utcDate);
      return d.toDateString() === new Date().toDateString();
    });

    // Sync to Neon DB every 5 minutes in background
    if (now - lastDbSync > DB_SYNC_INTERVAL) {
      lastDbSync = now;
      syncAllWorldCupMatches().catch(() => {});
    }

    return NextResponse.json({
      live,
      today,
      total: allMatches.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
