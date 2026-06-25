import { NextResponse } from "next/server";
import { getWorldCupMatches } from "@/lib/api/football-data";

export const revalidate = 10;

export async function GET() {
  try {
    const data = await getWorldCupMatches();

    const now = new Date();
    const matches = data.matches
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

    const live = matches.filter((m) => m.status === "IN_PLAY" || m.status === "PAUSED");
    const today = matches.filter((m) => {
      const d = new Date(m.utcDate);
      return d.toDateString() === now.toDateString();
    });

    return NextResponse.json({
      live,
      today,
      total: matches.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
