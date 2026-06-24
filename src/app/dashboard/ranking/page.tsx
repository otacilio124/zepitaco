import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/lib/queries";

export default async function RankingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">
          Ranking
        </h1>
        <p className="text-sm text-muted mt-1">
          Os melhores palpiteiros do Zé Pitaco
        </p>
      </div>

      {leaderboard.length > 0 ? (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_60px_60px_60px_60px] gap-0 px-4 py-2.5 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-border">
            <span className="text-center">#</span>
            <span>Pitaqueiro</span>
            <span className="text-center">Total</span>
            <span className="text-center">Exatos</span>
            <span className="text-center">Certos</span>
            <span className="text-center">%</span>
          </div>

          {leaderboard.map((user, i) => {
            const isMe = user.id === session.user?.id;
            const position = i + 1;
            const medal =
              position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null;

            return (
              <div
                key={user.id}
                className={`grid grid-cols-[40px_1fr_60px_60px_60px_60px] gap-0 px-4 py-3 items-center border-b border-border last:border-0 transition-colors ${
                  isMe ? "bg-accent-purple/[0.06]" : ""
                }`}
              >
                <span className="text-center text-sm">
                  {medal || (
                    <span className="text-xs text-muted font-mono">{position}</span>
                  )}
                </span>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isMe
                        ? "bg-accent-purple/20 text-accent-purple"
                        : "bg-surface-hover text-muted"
                    }`}
                  >
                    {user.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className={`text-sm font-medium truncate block ${isMe ? "text-accent-purple" : "text-white"}`}>
                      {user.name}
                      {isMe && <span className="text-[10px] text-muted ml-1">(você)</span>}
                    </span>
                  </div>
                </div>

                <span className="text-xs text-muted text-center font-mono">
                  {user.total}
                </span>
                <span className="text-xs text-accent-yellow text-center font-bold">
                  {user.exactHits}
                </span>
                <span className="text-xs text-accent-green text-center font-bold">
                  {user.correctWinner}
                </span>
                <span className={`text-xs text-center font-bold ${
                  user.accuracy >= 60 ? "text-accent-green" : user.accuracy >= 40 ? "text-accent-yellow" : "text-accent-red"
                }`}>
                  {user.accuracy}%
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-lg mb-2">🏆</p>
          <p className="text-white font-medium">Nenhum pitaco registrado ainda</p>
          <p className="text-sm text-muted mt-1">
            Seja o primeiro a aparecer no ranking!
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-accent-yellow">Exatos</span>
          <span>= placar cravado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-accent-green">Certos</span>
          <span>= acertou o vencedor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold">%</span>
          <span>= aproveitamento geral</span>
        </div>
      </div>
    </div>
  );
}
