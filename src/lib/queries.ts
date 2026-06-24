import { db } from "./db";
import { matches, predictions, users, worldCupGroups } from "./db/schema";
import { eq, gte, lte, and, asc, desc, count } from "drizzle-orm";

export async function getUpcomingMatches(limit = 20) {
  return db
    .select()
    .from(matches)
    .where(eq(matches.status, "scheduled"))
    .orderBy(asc(matches.matchDate))
    .limit(limit);
}

export async function getLiveMatches() {
  return db
    .select()
    .from(matches)
    .where(eq(matches.status, "live"))
    .orderBy(asc(matches.matchDate));
}

export async function getRecentResults(limit = 20) {
  return db
    .select()
    .from(matches)
    .where(eq(matches.status, "finished"))
    .orderBy(desc(matches.matchDate))
    .limit(limit);
}

export async function getMatchesByDateRange(from: Date, to: Date) {
  return db
    .select()
    .from(matches)
    .where(and(gte(matches.matchDate, from), lte(matches.matchDate, to)))
    .orderBy(asc(matches.matchDate));
}

export async function getMatchById(matchId: number) {
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.matchId, matchId))
    .limit(1);
  return match ?? null;
}

export async function getUserPredictions(userId: string) {
  return db
    .select({
      prediction: predictions,
      match: matches,
    })
    .from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.matchId))
    .where(eq(predictions.userId, userId))
    .orderBy(asc(matches.matchDate));
}

export async function getUserPredictionForMatch(userId: string, matchId: number) {
  const [prediction] = await db
    .select()
    .from(predictions)
    .where(and(eq(predictions.userId, userId), eq(predictions.matchId, matchId)))
    .limit(1);
  return prediction ?? null;
}

export async function getUserStats(userId: string) {
  const userPredictions = await db
    .select({
      prediction: predictions,
      match: matches,
    })
    .from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.matchId))
    .where(eq(predictions.userId, userId));

  const total = userPredictions.length;
  let exactHits = 0;
  let correctWinner = 0;

  for (const { prediction, match } of userPredictions) {
    if (match.status !== "finished" || match.homeScore === null || match.awayScore === null) continue;

    if (
      prediction.predictedHomeScore === match.homeScore &&
      prediction.predictedAwayScore === match.awayScore
    ) {
      exactHits++;
      correctWinner++;
    } else {
      const predictedResult = Math.sign(prediction.predictedHomeScore - prediction.predictedAwayScore);
      const actualResult = Math.sign(match.homeScore - match.awayScore);
      if (predictedResult === actualResult) {
        correctWinner++;
      }
    }
  }

  return { total, exactHits, correctWinner };
}

export async function getTotalMatchesCount() {
  const [result] = await db.select({ count: count() }).from(matches);
  return result?.count ?? 0;
}

export async function getMatchesByDate(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return db
    .select()
    .from(matches)
    .where(and(gte(matches.matchDate, start), lte(matches.matchDate, end)))
    .orderBy(asc(matches.matchDate));
}

export async function getAllGroups() {
  return db.select().from(worldCupGroups).orderBy(asc(worldCupGroups.id));
}

export async function getLeaderboard() {
  const allUsers = await db.select({ id: users.id, name: users.name }).from(users);

  const leaderboard = [];
  for (const user of allUsers) {
    if (!user.id) continue;
    const stats = await getUserStats(user.id);
    if (stats.total === 0) continue;
    leaderboard.push({
      id: user.id,
      name: user.name || "Anônimo",
      ...stats,
      accuracy: Math.round((stats.correctWinner / stats.total) * 100),
    });
  }

  return leaderboard.sort((a, b) => {
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    if (b.correctWinner !== a.correctWinner) return b.correctWinner - a.correctWinner;
    return b.total - a.total;
  });
}
