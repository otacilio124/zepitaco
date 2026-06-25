import { NextResponse } from "next/server";
import { getWorldCupMatches, getWorldCupStandings } from "@/lib/api/football-data";

export const revalidate = 30;

export async function GET() {
  try {
    const [matchesData, standingsData] = await Promise.all([
      getWorldCupMatches(),
      getWorldCupStandings(),
    ]);

    const knockout = matchesData.matches
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

    const groups = standingsData.standings
      .filter((s) => s.type === "TOTAL")
      .map((g) => ({
        group: g.group,
        table: g.table.map((t) => ({
          position: t.position,
          team: t.team.shortName,
          tla: t.team.tla,
          points: t.points,
          played: t.playedGames,
          gd: t.goalDifference,
          qualified: t.playedGames >= 3 && t.position <= 2,
        })),
      }));

    const groupStage = matchesData.matches.filter((m) => m.stage === "GROUP_STAGE");
    const groupsFinished = groupStage.every((m) => m.status === "FINISHED");

    return NextResponse.json({ matches: knockout, groups, groupsFinished });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
