import { NextResponse } from "next/server";
import { getESPNScoreboard } from "@/lib/api/espn";
import { syncAllWorldCupMatches } from "@/lib/api/sync";

export const revalidate = 10;

let lastDbSync = 0;
const DB_SYNC_INTERVAL = 5 * 60 * 1000;

export async function GET() {
  try {
    const matches = await getESPNScoreboard();
    const live = matches.filter((m) => m.status === "live");
    const finished = matches.filter((m) => m.status === "finished");
    const scheduled = matches.filter((m) => m.status === "scheduled");

    const now = Date.now();
    if (now - lastDbSync > DB_SYNC_INTERVAL) {
      lastDbSync = now;
      syncAllWorldCupMatches().catch(() => {});
    }

    return NextResponse.json({
      live,
      finished,
      scheduled,
      matches,
      total: matches.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
