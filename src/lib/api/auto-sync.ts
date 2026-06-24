import { db } from "../db";
import { matches } from "../db/schema";
import { desc } from "drizzle-orm";
import { syncAllWorldCupMatches } from "./sync";

const SYNC_INTERVAL_MS = 30 * 60 * 1000;
let lastSyncAttempt = 0;
let syncing = false;

export async function checkAndSync(): Promise<{ synced: boolean; reason: string }> {
  const now = Date.now();

  if (syncing) return { synced: false, reason: "sync in progress" };
  if (now - lastSyncAttempt < SYNC_INTERVAL_MS) {
    return { synced: false, reason: "too soon" };
  }

  const [latest] = await db
    .select({ cachedAt: matches.cachedAt })
    .from(matches)
    .orderBy(desc(matches.cachedAt))
    .limit(1);

  const lastCached = latest?.cachedAt ? new Date(latest.cachedAt).getTime() : 0;
  const isStale = now - lastCached > SYNC_INTERVAL_MS;

  if (!isStale) {
    lastSyncAttempt = now;
    return { synced: false, reason: "cache fresh" };
  }

  syncing = true;
  lastSyncAttempt = now;

  try {
    const synced = await syncAllWorldCupMatches();
    return { synced: true, reason: `synced ${synced} matches` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    return { synced: false, reason: `error: ${msg}` };
  } finally {
    syncing = false;
  }
}
