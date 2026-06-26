import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/lib/queries";

export default async function RankingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-white">Ranking</h1>
        <p className="text-xs text-muted mt-0.5">Os melhores palpiteiros do Zé Pitaco</p>
      </div>

      {leaderboard.length > 0 ? (
        <div className="space-y-2 max-w-3xl">
          {leaderboard.map((user, i) => {
            const isMe = user.id === session.user?.id;
            const position = i + 1;
            const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null;

            return (
              <div
                key={user.id}
                className={`card p-3.5 flex items-center gap-3 ${isMe ? "!border-accent-purple/30 bg-accent-purple/[0.04]" : ""}`}
              >
                {/* Position */}
                <div className="w-8 text-center shrink-0">
                  {medal ? (
                    <span className="text-lg">{medal}</span>
                  ) : (
                    <span className="text-xs font-bold text-muted">{position}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isMe ? "bg-accent-purple/15 text-accent-purple" : "bg-surface-2 text-muted-light"
                }`}>
                  {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe ? "text-accent-purple" : "text-white"}`}>
                    {user.name}
                    {isMe && <span className="text-[10px] text-muted ml-1">(você)</span>}
                  </p>
                  <p className="text-[10px] text-muted">
                    {user.total} pitacos · {user.accuracy}% aproveitamento
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-center">
                    <span className="text-sm font-bold text-white">{user.exactHits}</span>
                    <span className="text-[9px] text-muted block">exatos</span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-muted-light">{user.correctWinner}</span>
                    <span className="text-[9px] text-muted block">certos</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-2xl mb-2">🏆</p>
          <p className="text-sm text-white">Nenhum pitaco registrado ainda</p>
          <p className="text-xs text-muted mt-1">Seja o primeiro a aparecer no ranking!</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted">
        <span><span className="font-semibold text-white">Exatos</span> = placar cravado</span>
        <span><span className="font-semibold text-muted-light">Certos</span> = acertou vencedor</span>
      </div>
    </div>
  );
}
