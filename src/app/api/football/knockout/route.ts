import { NextResponse } from "next/server";
import { getWorldCupMatches, getWorldCupStandings } from "@/lib/api/football-data";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

export const revalidate = 30;

async function getESPNKnockoutMatches() {
  const matches: { date: string; home: string; away: string; status: string; id: string }[] = [];
  const dates: string[] = [];

  const start = new Date("2026-06-28");
  const end = new Date("2026-07-20");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0"));
  }

  for (const dateStr of dates) {
    try {
      const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${dateStr}`, { next: { revalidate: 60 } });
      if (!res.ok) continue;
      const data = await res.json();
      data.events?.forEach((e: { id: string; shortName: string; date: string; status?: { type?: { description?: string } }; competitions?: { competitors?: { team?: { displayName?: string; abbreviation?: string }; homeAway?: string }[] }[] }) => {
        const comp = e.competitions?.[0];
        const home = comp?.competitors?.find(c => c.homeAway === "home");
        const away = comp?.competitors?.find(c => c.homeAway === "away");
        if (home?.team?.displayName && away?.team?.displayName) {
          matches.push({
            date: e.date,
            home: home.team.abbreviation || home.team.displayName,
            away: away.team.abbreviation || away.team.displayName,
            status: e.status?.type?.description || "Scheduled",
            id: e.id,
          });
        }
      });
    } catch { /* skip */ }
  }
  return matches;
}

export async function GET() {
  try {
    const [matchesData, standingsData, espnKO] = await Promise.all([
      getWorldCupMatches(),
      getWorldCupStandings(),
      getESPNKnockoutMatches(),
    ]);

    // Build knockout from Football-Data
    const knockout = matchesData.matches
      .filter((m) => m.stage !== "GROUP_STAGE")
      .map((m) => {
        let home = m.homeTeam?.shortName || null;
        let away = m.awayTeam?.shortName || null;

        // Try to fill missing teams from ESPN data
        if (!home || !away) {
          const matchDate = new Date(m.utcDate);
          const espnMatch = espnKO.find(e => {
            const espnDate = new Date(e.date);
            return Math.abs(espnDate.getTime() - matchDate.getTime()) < 3600000 * 3;
          });
          if (espnMatch) {
            if (!home && espnMatch.home && !espnMatch.home.includes("3RD") && !espnMatch.home.includes("2")) {
              home = espnMatch.home;
            }
            if (!away && espnMatch.away && !espnMatch.away.includes("3RD") && !espnMatch.away.includes("2")) {
              away = espnMatch.away;
            }
          }
        }

        return {
          id: m.id,
          home,
          away,
          homeScore: m.score.fullTime.home,
          awayScore: m.score.fullTime.away,
          status: m.status,
          utcDate: m.utcDate,
          stage: m.stage,
        };
      });

    // Standings and qualified teams
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
