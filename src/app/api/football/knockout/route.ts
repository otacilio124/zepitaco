import { NextResponse } from "next/server";
import { getESPNScoreboard, getESPNStandings } from "@/lib/api/espn";

export const revalidate = 30;

export async function GET() {
  try {
    const standings = await getESPNStandings();

    // Fetch knockout dates
    const knockoutMatches: any[] = [];
    const start = new Date("2026-06-28");
    const end = new Date("2026-07-20");

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ds = d.getFullYear().toString() +
        String(d.getMonth() + 1).padStart(2, "0") +
        String(d.getDate()).padStart(2, "0");

      try {
        const matches = await getESPNScoreboard(ds);
        matches.forEach((m) => {
          knockoutMatches.push({
            ...m,
            stage: detectStage(new Date(m.utcDate)),
          });
        });
      } catch { /* skip date */ }
    }

    // Qualified teams
    const qualifiedTeams: { team: string; group: string; position: number; logo: string }[] = [];
    standings.forEach((g) => {
      g.entries.forEach((e, i) => {
        if (e.stats.advanced) {
          qualifiedTeams.push({
            team: e.team.displayName,
            group: g.name.replace("Group ", ""),
            position: i + 1,
            logo: e.team.logo,
          });
        }
      });
    });

    const unfinishedGroups = standings.filter((g) =>
      g.entries.some((e) => e.stats.gamesPlayed < 3)
    );

    return NextResponse.json({
      matches: knockoutMatches,
      groups: standings.map((g) => ({
        ...g,
        finished: g.entries.every((e) => e.stats.gamesPlayed >= 3),
      })),
      qualifiedTeams,
      groupsFinished: unfinishedGroups.length === 0,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function detectStage(date: Date): string {
  const d = date.getTime();
  const dates: [string, string, string][] = [
    ["2026-06-28", "2026-07-04", "LAST_32"],
    ["2026-07-04", "2026-07-08", "LAST_16"],
    ["2026-07-09", "2026-07-13", "QUARTER_FINALS"],
    ["2026-07-14", "2026-07-16", "SEMI_FINALS"],
    ["2026-07-18", "2026-07-18", "THIRD_PLACE"],
    ["2026-07-19", "2026-07-20", "FINAL"],
  ];
  for (const [start, end, stage] of dates) {
    if (d >= new Date(start).getTime() && d <= new Date(end + "T23:59:59Z").getTime()) return stage;
  }
  return "LAST_32";
}
