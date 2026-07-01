import { NextResponse } from "next/server";
import { getESPNScoreboard, getESPNStandings } from "@/lib/api/espn";

export const dynamic = "force-dynamic";

async function checkWithTimeout<T>(promise: Promise<T>, ms: number): Promise<boolean> {
  try {
    await Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const [espnScoreboard, espnStandings] = await Promise.all([
    checkWithTimeout(getESPNScoreboard(), 6000),
    checkWithTimeout(getESPNStandings(), 6000),
  ]);

  const allReady = espnScoreboard && espnStandings;

  return NextResponse.json({
    ready: allReady,
    services: {
      espnScoreboard,
      espnStandings,
    },
    timestamp: new Date().toISOString(),
  });
}
