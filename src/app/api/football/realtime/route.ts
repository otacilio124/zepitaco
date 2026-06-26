import { NextResponse } from "next/server";
import { syncAllWorldCupMatches } from "@/lib/api/sync";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

export const revalidate = 10;

let lastDbSync = 0;
const DB_SYNC_INTERVAL = 5 * 60 * 1000;

type ESPNDetail = {
  clock?: { displayValue?: string };
  type?: { text?: string };
  team?: { abbreviation?: string };
  athletesInvolved?: { displayName?: string; headshot?: { href?: string } }[];
};

type ESPNCompetitor = {
  team?: { abbreviation?: string; displayName?: string; logo?: string; id?: string };
  score?: string;
  homeAway?: string;
  records?: { type?: string; summary?: string }[];
  statistics?: { name?: string; displayValue?: string }[];
};

type ESPNEvent = {
  id: string;
  shortName: string;
  date: string;
  status?: {
    clock?: number;
    displayClock?: string;
    period?: number;
    type?: { description?: string; state?: string; completed?: boolean; detail?: string; shortDetail?: string };
  };
  venue?: { displayName?: string };
  competitions?: {
    competitors?: ESPNCompetitor[];
    details?: ESPNDetail[];
    headlines?: { shortLinkText?: string }[];
  }[];
};

function getStat(stats: { name?: string; displayValue?: string }[] | undefined, name: string): string {
  return stats?.find((s) => s.name === name)?.displayValue || "0";
}

export async function GET() {
  try {
    const res = await fetch(`${ESPN_BASE}/scoreboard`, { next: { revalidate: 10 } });
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const data = await res.json();

    const events = (data.events || []).map((e: ESPNEvent) => {
      const comp = e.competitions?.[0];
      const home = comp?.competitors?.find((c) => c.homeAway === "home");
      const away = comp?.competitors?.find((c) => c.homeAway === "away");
      const homeStats = home?.statistics;
      const awayStats = away?.statistics;

      const state = e.status?.type?.state;
      const isLive = state === "in";
      const isFinished = state === "post";
      const isScheduled = state === "pre";

      return {
        id: e.id,
        homeTeam: home?.team?.displayName || "?",
        awayTeam: away?.team?.displayName || "?",
        homeAbbr: home?.team?.abbreviation || "?",
        awayAbbr: away?.team?.abbreviation || "?",
        homeLogo: home?.team?.logo || null,
        awayLogo: away?.team?.logo || null,
        homeScore: parseInt(home?.score || "0"),
        awayScore: parseInt(away?.score || "0"),
        utcDate: e.date,
        status: isLive ? "live" : isFinished ? "finished" : "scheduled",
        clock: e.status?.displayClock || null,
        period: e.status?.period || null,
        statusDetail: e.status?.type?.detail || e.status?.type?.shortDetail || null,
        statusDescription: e.status?.type?.description || null,
        venue: e.venue?.displayName || null,
        headline: comp?.headlines?.[0]?.shortLinkText || null,
        homeRecord: home?.records?.find((r) => r.type === "total")?.summary || null,
        awayRecord: away?.records?.find((r) => r.type === "total")?.summary || null,
        homePossession: getStat(homeStats, "possessionPct"),
        awayPossession: getStat(awayStats, "possessionPct"),
        homeShots: getStat(homeStats, "totalShots"),
        awayShots: getStat(awayStats, "totalShots"),
        homeShotsOnTarget: getStat(homeStats, "shotsOnTarget"),
        awayShotsOnTarget: getStat(awayStats, "shotsOnTarget"),
        homeCorners: getStat(homeStats, "wonCorners"),
        awayCorners: getStat(awayStats, "wonCorners"),
        homeFouls: getStat(homeStats, "foulsCommitted"),
        awayFouls: getStat(awayStats, "foulsCommitted"),
        events: (comp?.details || []).map((d) => ({
          minute: d.clock?.displayValue || "",
          type: d.type?.text || "",
          player: d.athletesInvolved?.[0]?.displayName || null,
          playerPhoto: d.athletesInvolved?.[0]?.headshot?.href || null,
          team: d.team?.abbreviation || null,
        })),
      };
    });

    const live = events.filter((e: { status: string }) => e.status === "live");
    const finished = events.filter((e: { status: string }) => e.status === "finished");
    const scheduled = events.filter((e: { status: string }) => e.status === "scheduled");

    const now = Date.now();
    if (now - lastDbSync > DB_SYNC_INTERVAL) {
      lastDbSync = now;
      syncAllWorldCupMatches().catch(() => {});
    }

    return NextResponse.json({
      live,
      finished,
      scheduled,
      matches: events,
      total: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
