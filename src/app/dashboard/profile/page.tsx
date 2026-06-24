import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getUserStats, getUserPredictions, getLeaderboard } from "@/lib/queries";
import { getUserPrefs } from "@/lib/onboarding-actions";
import { getCountryCode } from "@/lib/country-codes";
import { LocalTime } from "@/components/ui/local-time";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [stats, predictions, prefs, leaderboard] = await Promise.all([
    getUserStats(session.user.id),
    getUserPredictions(session.user.id),
    getUserPrefs(session.user.id),
    getLeaderboard(),
  ]);

  const myRank = leaderboard.findIndex((u) => u.id === session.user?.id) + 1;
  const totalUsers = leaderboard.length;

  const recentPreds = predictions.slice(-10).reverse();

  let streak = 0;
  for (const { prediction, match } of [...predictions].reverse()) {
    if (match.status !== "finished" || match.homeScore === null || match.awayScore === null) continue;
    const correct =
      Math.sign(prediction.predictedHomeScore - prediction.predictedAwayScore) ===
      Math.sign(match.homeScore - match.awayScore);
    if (correct) streak++;
    else break;
  }

  const accuracy = stats.total > 0 ? Math.round((stats.correctWinner / stats.total) * 100) : 0;
  const countryCode = prefs?.favoriteCountry ? getCountryCode(prefs.favoriteCountry) : null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full gradient-spectrum flex items-center justify-center text-xl font-bold text-white shrink-0">
            {(session.user.name || "U")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-white truncate">
              {session.user.name}
            </h1>
            <p className="text-sm text-muted truncate">{session.user.email}</p>
            {prefs?.favoriteCountry && countryCode && (
              <div className="flex items-center gap-2 mt-1.5">
                <Image
                  src={`https://flagcdn.com/w40/${countryCode}.png`}
                  alt={prefs.favoriteCountry}
                  width={20}
                  height={14}
                  className="rounded-sm object-cover"
                  unoptimized
                />
                <span className="text-xs text-muted-light">{prefs.favoriteCountry}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-accent-purple">{stats.total}</div>
          <div className="text-[10px] text-muted mt-0.5">Pitacos</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-accent-yellow">{stats.exactHits}</div>
          <div className="text-[10px] text-muted mt-0.5">Exatos</div>
        </div>
        <div className="card p-4 text-center">
          <div className={`text-2xl font-bold ${accuracy >= 50 ? "text-accent-green" : "text-accent-red"}`}>
            {accuracy}%
          </div>
          <div className="text-[10px] text-muted mt-0.5">Aproveitamento</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-accent-red">
            {myRank > 0 ? `#${myRank}` : "—"}
          </div>
          <div className="text-[10px] text-muted mt-0.5">
            Ranking {totalUsers > 0 ? `/ ${totalUsers}` : ""}
          </div>
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="card p-4 gradient-border rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-sm font-bold text-white">{streak} acertos seguidos!</p>
                <p className="text-xs text-muted">Mantenha a sequência</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-accent-yellow">{streak}</span>
          </div>
        </div>
      )}

      {/* Recent Predictions */}
      {recentPreds.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Histórico de Pitacos
            </h2>
          </div>
          {recentPreds.map(({ prediction, match }) => {
            const isExact =
              match.status === "finished" &&
              prediction.predictedHomeScore === match.homeScore &&
              prediction.predictedAwayScore === match.awayScore;
            const isCorrect =
              match.status === "finished" &&
              match.homeScore !== null &&
              match.awayScore !== null &&
              Math.sign(prediction.predictedHomeScore - prediction.predictedAwayScore) ===
                Math.sign(match.homeScore - match.awayScore);

            return (
              <Link
                key={prediction.id}
                href={`/dashboard/matches/${match.matchId}`}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <span className="text-xs text-white truncate block">
                    {match.homeTeam} vs {match.awayTeam}
                  </span>
                  <LocalTime date={match.matchDate} format="date" className="text-[10px] text-muted" />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-muted-light font-mono block">
                      {prediction.predictedHomeScore}-{prediction.predictedAwayScore}
                    </span>
                    {match.status === "finished" && (
                      <span className="text-[10px] text-muted font-mono">
                        Real: {match.homeScore}-{match.awayScore}
                      </span>
                    )}
                  </div>
                  {match.status === "finished" ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isExact
                          ? "text-accent-green bg-accent-green/10"
                          : isCorrect
                            ? "text-accent-yellow bg-accent-yellow/10"
                            : "text-accent-red bg-accent-red/10"
                      }`}
                    >
                      {isExact ? "EXATO" : isCorrect ? "CERTO" : "ERROU"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-accent-purple bg-accent-purple/10">
                      PENDENTE
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {predictions.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-muted">Nenhum pitaco registrado</p>
          <Link href="/dashboard/matches" className="text-xs text-accent-purple mt-2 inline-block">
            Fazer seu primeiro pitaco →
          </Link>
        </div>
      )}
    </div>
  );
}
