import { NextResponse } from "next/server";
import { getWorldCupMatches } from "@/lib/api/football-data";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getWorldCupMatches();

    const knockout = data.matches
      .filter((m) => m.stage !== "GROUP_STAGE")
      .map((m) => ({
        id: m.id,
        home: m.homeTeam?.shortName || null,
        away: m.awayTeam?.shortName || null,
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
        status: m.status,
        utcDate: m.utcDate,
        stage: m.stage,
      }));

    return NextResponse.json({ matches: knockout });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
