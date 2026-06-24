"use server";

import { auth } from "./auth";
import { db } from "./db";
import { userPreferences } from "./db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function saveOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const favoriteCountry = formData.get("country") as string;
  const favoriteTeam = formData.get("team") as string;
  const favoriteTeamId = Number(formData.get("teamId")) || null;
  const favoriteLeague = formData.get("league") as string;
  const favoriteLeagueId = Number(formData.get("leagueId")) || null;

  const [existing] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  if (existing) {
    await db
      .update(userPreferences)
      .set({
        favoriteCountry,
        favoriteTeam,
        favoriteTeamId,
        favoriteLeague,
        favoriteLeagueId,
        onboardingCompleted: true,
      })
      .where(eq(userPreferences.userId, session.user.id));
  } else {
    await db.insert(userPreferences).values({
      userId: session.user.id,
      favoriteCountry,
      favoriteTeam,
      favoriteTeamId,
      favoriteLeague,
      favoriteLeagueId,
      onboardingCompleted: true,
    });
  }

  redirect("/dashboard");
}

export async function getUserPrefs(userId: string) {
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return prefs ?? null;
}
