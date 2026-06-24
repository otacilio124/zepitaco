"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";

type LiveMatch = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  matchDate: string;
};

function LiveMatchCard({ match, index }: { match: LiveMatch; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        href={`/dashboard/matches/${match.matchId}`}
        className="card card-interactive block p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-red live-pulse" />
            <span className="text-xs font-bold text-accent-red">AO VIVO</span>
          </div>
          <span className="text-xs text-muted">
            {new Date(match.matchDate).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
<TeamFlag name={match.homeTeam} size={32} />
            <span className="text-sm font-semibold text-white truncate">{match.homeTeam}</span>
          </div>
          <div className="px-5 text-center shrink-0">
            <motion.div
              key={`${match.homeScore}-${match.awayScore}`}
              initial={{ scale: 1.3, color: "#1BF266" }}
              animate={{ scale: 1, color: "#ededed" }}
              className="text-2xl font-bold"
            >
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </motion.div>
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <span className="text-sm font-semibold text-white truncate text-right">{match.awayTeam}</span>
<TeamFlag name={match.awayTeam} size={32} />
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className="text-xs text-accent-purple">Ver análise →</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LivePage() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function fetchLive() {
    try {
      const res = await fetch("/api/football/live");
      const data = await res.json();
      setMatches(data.matches || []);
      setLastUpdate(new Date());
    } catch {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-accent-red live-pulse" />
            Ao Vivo
          </h1>
          <p className="text-sm text-muted mt-1">
            Atualização automática a cada 60s
          </p>
        </div>
        {lastUpdate && (
          <span className="text-xs text-muted">
            {lastUpdate.toLocaleTimeString("pt-BR")}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 h-28 shimmer" />
          ))}
        </div>
      ) : matches.length > 0 ? (
        <AnimatePresence>
          <div className="space-y-3">
            {matches.map((match, i) => (
              <LiveMatchCard key={match.matchId} match={match} index={i} />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-12 text-center"
        >
          <div className="text-4xl mb-4">⚽</div>
          <p className="text-white font-medium">Nenhum jogo ao vivo agora</p>
          <p className="text-sm text-muted mt-1">
            Volte quando tiver partidas em andamento
          </p>
        </motion.div>
      )}
    </div>
  );
}
