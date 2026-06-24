"use server";

import { auth } from "./auth";
import { db } from "./db";
import { predictions, matches } from "./db/schema";
import { eq, and } from "drizzle-orm";

export async function submitPrediction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Você precisa estar logado." };
  }

  const matchId = Number(formData.get("matchId"));
  const predictedHomeScore = Number(formData.get("homeScore"));
  const predictedAwayScore = Number(formData.get("awayScore"));

  if (isNaN(matchId) || isNaN(predictedHomeScore) || isNaN(predictedAwayScore)) {
    return { error: "Dados inválidos." };
  }

  if (predictedHomeScore < 0 || predictedAwayScore < 0) {
    return { error: "Placar não pode ser negativo." };
  }

  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.matchId, matchId))
    .limit(1);

  if (!match) {
    return { error: "Partida não encontrada." };
  }

  if (match.status !== "scheduled") {
    return { error: "Palpites só podem ser feitos antes do jogo começar." };
  }

  const [existing] = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.userId, session.user.id),
        eq(predictions.matchId, matchId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(predictions)
      .set({
        predictedHomeScore,
        predictedAwayScore,
        createdAt: new Date(),
      })
      .where(eq(predictions.id, existing.id));

    return { success: true, updated: true };
  }

  await db.insert(predictions).values({
    userId: session.user.id,
    matchId,
    predictedHomeScore,
    predictedAwayScore,
  });

  return { success: true, updated: false };
}
