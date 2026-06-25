"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";
import { LocalTime } from "@/components/ui/local-time";

type RealtimeMatch = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTla: string;
  awayTla: string;
  utcDate: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  group: string | null;
  matchday: number;
};

type RealtimeData = {
  live: RealtimeMatch[];
  today: RealtimeMatch[];
  total: number;
  timestamp: string;
};

function LiveMatchCard({ match, index }: { match: RealtimeMatch; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/dashboard/matches/${match.id}`} className="card card-interactive block p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-red live-pulse" />
            <span className="text-xs font-semibold text-accent-red">AO VIVO</span>
          </div>
          {match.group && (
            <span className="text-[10px] text-muted">{match.group.replace("GROUP_", "Grupo ")}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TeamFlag name={match.homeTeam} size={32} />
            <span className="text-sm font-semibold text-white truncate">{match.homeTeam}</span>
          </div>
          <motion.div
            key={`${match.homeScore}-${match.awayScore}`}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className="px-5 text-center shrink-0"
          >
            <span className="text-2xl font-bold text-white">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </span>
          </motion.div>
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <span className="text-sm font-semibold text-white truncate text-right">{match.awayTeam}</span>
            <TeamFlag name={match.awayTeam} size={32} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function TodayMatchCard({ match }: { match: RealtimeMatch }) {
  const isFinished = match.status === "FINISHED";
  return (
    <Link href={`/dashboard/matches/${match.id}`} className="card card-interactive block p-4">
      <div className="flex items-center justify-between text-[10px] text-muted mb-2">
        <LocalTime date={match.utcDate} format="time" />
        <span>{isFinished ? "Encerrado" : match.status === "TIMED" || match.status === "SCHEDULED" ? "Agendado" : match.status}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamFlag name={match.homeTeam} size={22} />
          <span className="text-xs text-white truncate">{match.homeTeam}</span>
        </div>
        <span className="text-xs px-3 shrink-0">
          {isFinished || match.status === "IN_PLAY" || match.status === "PAUSED" ? (
            <span className="font-semibold text-white">{match.homeScore} - {match.awayScore}</span>
          ) : (
            <span className="text-muted">vs</span>
          )}
        </span>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-xs text-white truncate text-right">{match.awayTeam}</span>
          <TeamFlag name={match.awayTeam} size={22} />
        </div>
      </div>
    </Link>
  );
}

export default function LivePage() {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [nextRefresh, setNextRefresh] = useState(10);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/football/realtime");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
      setNextRefresh(10);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const dataInterval = setInterval(fetchData, 10000);
    const countdownInterval = setInterval(() => {
      setNextRefresh((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(countdownInterval);
    };
  }, [fetchData]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-red live-pulse" />
            Ao Vivo
          </h1>
          <p className="text-[10px] text-muted mt-0.5">
            Atualiza a cada 10 segundos
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <motion.div
              key={nextRefresh}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="h-1.5 w-1.5 rounded-full bg-accent-purple"
            />
            <span className="text-[10px] text-muted font-mono">{nextRefresh}s</span>
          </div>
          {lastUpdate && (
            <span className="text-[10px] text-muted">{lastUpdate}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-24 shimmer" />
          ))}
        </div>
      ) : (
        <>
          {/* Live matches */}
          {data && data.live.length > 0 ? (
            <AnimatePresence>
              <div className="space-y-3">
                {data.live.map((match, i) => (
                  <LiveMatchCard key={match.id} match={match} index={i} />
                ))}
              </div>
            </AnimatePresence>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-10 text-center">
              <p className="text-sm text-white">Nenhum jogo ao vivo agora</p>
              <p className="text-xs text-muted mt-1">Os placares atualizam automaticamente quando um jogo começar</p>
            </motion.div>
          )}

          {/* Today's matches */}
          {data && data.today.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">
                Jogos de Hoje ({data.today.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {data.today.filter((m) => m.status !== "IN_PLAY" && m.status !== "PAUSED").map((match) => (
                  <TodayMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-muted text-center">
        Football data provided by Football-Data.org
      </p>
    </div>
  );
}
