import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getUpcomingMatches,
  getLiveMatches,
  getRecentResults,
  getUserStats,
  getTotalMatchesCount,
  getUserPredictions,
} from "@/lib/queries";
import { getUserPrefs } from "@/lib/onboarding-actions";
import { DashboardClient } from "@/components/dashboard-client";
import { checkAndSync } from "@/lib/api/auto-sync";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const prefs = await getUserPrefs(session.user.id);
  if (!prefs?.onboardingCompleted) redirect("/onboarding");

  checkAndSync().catch(() => {});

  const [upcoming, live, recent, stats, totalMatches, userPreds] =
    await Promise.all([
      getUpcomingMatches(20),
      getLiveMatches(),
      getRecentResults(20),
      getUserStats(session.user.id),
      getTotalMatchesCount(),
      getUserPredictions(session.user.id),
    ]);

  const last5Predictions = userPreds.slice(-5).reverse();

  return (
    <DashboardClient
      user={{ name: session.user.name || "Usuário", id: session.user.id }}
      prefs={prefs}
      upcoming={upcoming}
      live={live}
      recent={recent}
      stats={stats}
      totalMatches={totalMatches}
      last5Predictions={last5Predictions}
    />
  );
}
