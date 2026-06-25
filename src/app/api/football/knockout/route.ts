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
      .map((g) => {
        const allPlayed = g.table.every((t) => t.playedGames >= 3);
        return {
          group: g.group,
          table: g.table.map((t) => ({
            position: t.position,
            team: t.team.shortName,
            tla: t.team.tla,
            points: t.points,
            played: t.playedGames,
            gd: t.goalDifference,
            qualified: allPlayed && t.position <= 2,
          })),
          finished: allPlayed,
        };
      });

    // Build list of qualified teams
    const qualifiedTeams: { team: string; group: string; position: number }[] = [];
    groups.forEach((g) => {
      if (g.finished) {
        g.table.slice(0, 2).forEach((t) => {
          qualifiedTeams.push({
            team: t.team,
            group: g.group.replace("GROUP_", ""),
            position: t.position,
          });
        });
      }
    });

    const groupStage = matchesData.matches.filter((m) => m.stage === "GROUP_STAGE");
    const groupsFinished = groupStage.every((m) => m.status === "FINISHED");

    return NextResponse.json({
      matches: knockout,
      groups,
      groupsFinished,
      qualifiedTeams,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
