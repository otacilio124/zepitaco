import { db } from "../db";
import { matches } from "../db/schema";
import { desc } from "drizzle-orm";
import { syncAllWorldCupMatches } from "./sync";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export async function checkAndSync(): Promise<{ synced: boolean; reason: string }> {
  const [latest] = await db
    .select({ cachedAt: matches.cachedAt })
    .from(matches)
    .orderBy(desc(matches.cachedAt))
    .limit(1);

  const lastCached = latest?.cachedAt ? new Date(latest.cachedAt).getTime() : 0;
  const isStale = Date.now() - lastCached > SYNC_INTERVAL_MS;

  if (!isStale) {
    return { synced: false, reason: "cache fresh" };
  }

  try {
    const synced = await syncAllWorldCupMatches();
    return { synced: true, reason: `synced ${synced} matches` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    return { synced: false, reason: `error: ${msg}` };
  }
}
