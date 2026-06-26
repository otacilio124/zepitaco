"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";
import { getCountryName } from "@/lib/country-codes";
import { LocalTime } from "@/components/ui/local-time";

type MatchEvent = {
  minute: string;
  type: string;
  player: string | null;
  playerPhoto: string | null;
  team: string | null;
};

type RealtimeMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string;
  awayAbbr: string;
  homeScore: number;
  awayScore: number;
  utcDate: string;
  status: string;
  clock: string | null;
  period: number | null;
  statusDetail: string | null;
  statusDescription: string | null;
  venue: string | null;
  headline: string | null;
  homeRecord: string | null;
  awayRecord: string | null;
  homePossession: string;
  awayPossession: string;
  homeShots: string;
  awayShots: string;
  homeShotsOnTarget: string;
  awayShotsOnTarget: string;
  homeCorners: string;
  awayCorners: string;
  homeFouls: string;
  awayFouls: string;
  events: MatchEvent[];
};

type RealtimeData = {
  live: RealtimeMatch[];
  finished: RealtimeMatch[];
  scheduled: RealtimeMatch[];
  matches: RealtimeMatch[];
  total: number;
};

function StatRow({ label, home, away }: { label: string; home: string; away: string }) {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  const total = h + a || 1;
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-white font-medium w-8 text-right">{home}</span>
      <div className="flex-1 flex h-1 rounded-full overflow-hidden bg-border">
        <div className="bg-accent-green/70 transition-all" style={{ width: `${(h / total) * 100}%` }} />
        <div className="bg-accent-purple/70 transition-all" style={{ width: `${(a / total) * 100}%` }} />
      </div>
      <span className="text-xs text-white font-medium w-8">{away}</span>
      <span className="text-[9px] text-muted w-16 text-right">{label}</span>
    </div>
  );
}

function LiveMatchCard({ match }: { match: RealtimeMatch }) {
  const [expanded, setExpanded] = useState(true);
  const goals = match.events.filter((e) => e.type.includes("Goal"));
  const cards = match.events.filter((e) => e.type.includes("Card"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden border-accent-red/30"
    >
      {/* Live header */}
      <div className="flex items-center justify-between px-4 py-2 bg-accent-red/10 border-b border-accent-red/20">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent-red live-pulse" />
          <span className="text-xs font-bold text-accent-red">AO VIVO</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white font-mono">{match.clock}</span>
          {match.period && (
            <span className="text-[9px] text-muted">{match.period === 1 ? "1º Tempo" : "2º Tempo"}</span>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <TeamFlag name={match.homeTeam} size={32} />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-white block truncate">{getCountryName(match.homeTeam)}</span>
              {match.homeRecord && <span className="text-[9px] text-muted">{match.homeRecord}</span>}
            </div>
          </div>
          <motion.div
            key={`${match.homeScore}-${match.awayScore}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="px-5 text-center shrink-0"
          >
            <span className="text-3xl font-bold text-white">{match.homeScore} - {match.awayScore}</span>
          </motion.div>
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <span className="text-sm font-semibold text-white block truncate">{getCountryName(match.awayTeam)}</span>
              {match.awayRecord && <span className="text-[9px] text-muted">{match.awayRecord}</span>}
            </div>
            <TeamFlag name={match.awayTeam} size={32} />
          </div>
        </div>

        {match.venue && (
          <p className="text-[10px] text-muted text-center mt-2">{match.venue}</p>
        )}
      </div>

      {/* Toggle stats */}
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-1.5 text-[10px] text-accent-purple font-medium border-t border-border hover:bg-surface-hover transition-colors">
        {expanded ? "Ocultar detalhes ▲" : "Ver detalhes ▼"}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Live stats */}
            <div className="px-4 py-3 border-t border-border">
              <p className="text-[9px] text-muted uppercase tracking-widest mb-2">Estatísticas ao vivo</p>
              <StatRow label="Posse" home={match.homePossession + "%"} away={match.awayPossession + "%"} />
              <StatRow label="Chutes" home={match.homeShots} away={match.awayShots} />
              <StatRow label="No gol" home={match.homeShotsOnTarget} away={match.awayShotsOnTarget} />
              <StatRow label="Escanteios" home={match.homeCorners} away={match.awayCorners} />
              <StatRow label="Faltas" home={match.homeFouls} away={match.awayFouls} />
            </div>

            {/* Events timeline */}
            {match.events.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <p className="text-[9px] text-muted uppercase tracking-widest mb-2">Eventos</p>
                <div className="space-y-1.5">
                  {match.events.map((evt, i) => {
                    const isGoal = evt.type.includes("Goal");
                    const isCard = evt.type.includes("Card");
                    const icon = isGoal ? "⚽" : evt.type.includes("Red") ? "🟥" : isCard ? "🟨" : "•";
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-accent-purple font-mono w-8 text-right shrink-0">{evt.minute}</span>
                        <span className="text-xs shrink-0">{icon}</span>
                        {evt.playerPhoto && <img src={evt.playerPhoto} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />}
                        <span className={`text-[11px] truncate ${isGoal ? "text-white font-semibold" : "text-muted-light"}`}>
                          {evt.player || evt.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FinishedMatchCard({ match }: { match: RealtimeMatch }) {
  return (
    <Link href={`/dashboard/matches/${match.id}`} className="card card-interactive block p-4">
      <div className="flex items-center justify-between text-[10px] text-muted mb-2">
        <LocalTime date={match.utcDate} format="time" />
        <span>{match.statusDetail || "Encerrado"}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamFlag name={match.homeTeam} size={22} />
          <span className="text-xs text-white truncate">{getCountryName(match.homeTeam)}</span>
        </div>
        <span className="text-sm font-bold text-white px-3 shrink-0">{match.homeScore} - {match.awayScore}</span>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-xs text-white truncate text-right">{getCountryName(match.awayTeam)}</span>
          <TeamFlag name={match.awayTeam} size={22} />
        </div>
      </div>
      {match.headline && (
        <p className="text-[10px] text-muted mt-2 truncate">{match.headline}</p>
      )}
    </Link>
  );
}

function ScheduledMatchCard({ match }: { match: RealtimeMatch }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-[10px] text-muted mb-2">
        <LocalTime date={match.utcDate} format="time" />
        {match.venue && <span className="truncate ml-2">{match.venue}</span>}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamFlag name={match.homeTeam} size={22} />
          <span className="text-xs text-white truncate">{getCountryName(match.homeTeam)}</span>
        </div>
        <span className="text-xs text-muted px-3 shrink-0">vs</span>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-xs text-white truncate text-right">{getCountryName(match.awayTeam)}</span>
          <TeamFlag name={match.awayTeam} size={22} />
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [nextRefresh, setNextRefresh] = useState(10);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/football/realtime");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
      setNextRefresh(10);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const dataInterval = setInterval(fetchData, 10000);
    const countdownInterval = setInterval(() => setNextRefresh((p) => Math.max(0, p - 1)), 1000);
    return () => { clearInterval(dataInterval); clearInterval(countdownInterval); };
  }, [fetchData]);

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA");
  const yesterdayDate = new Date(now); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toLocaleDateString("en-CA");
  const tomorrowDate = new Date(now); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA");

  const all = data?.matches || [];
  const todayFinished = all.filter((m) => m.status === "finished" && new Date(m.utcDate).toLocaleDateString("en-CA") === todayStr);
  const yesterdayMatches = all.filter((m) => new Date(m.utcDate).toLocaleDateString("en-CA") === yesterdayStr);
  const todayScheduled = all.filter((m) => m.status === "scheduled" && new Date(m.utcDate).toLocaleDateString("en-CA") === todayStr);
  const tomorrowMatches = all.filter((m) => new Date(m.utcDate).toLocaleDateString("en-CA") === tomorrowStr);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-red live-pulse" />
            Ao Vivo
          </h1>
          <p className="text-[10px] text-muted mt-0.5">ESPN · Atualiza a cada 10s</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted font-mono">{nextRefresh}s</span>
          {lastUpdate && <span className="text-[10px] text-muted">{lastUpdate}</span>}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-28 shimmer" />)}
        </div>
      ) : (
        <>
          {/* LIVE */}
          {data && data.live.length > 0 ? (
            <div className="space-y-3">
              {data.live.map((match) => (
                <LiveMatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-sm text-white">Nenhum jogo ao vivo agora</p>
              <p className="text-xs text-muted mt-1">Os dados atualizam automaticamente</p>
            </div>
          )}

          {/* Today scheduled */}
          {todayScheduled.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Ainda hoje ({todayScheduled.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {todayScheduled.map((m) => <ScheduledMatchCard key={m.id} match={m} />)}
              </div>
            </div>
          )}

          {/* Today finished */}
          {todayFinished.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Encerrados hoje ({todayFinished.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {todayFinished.map((m) => <FinishedMatchCard key={m.id} match={m} />)}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {yesterdayMatches.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Ontem ({yesterdayMatches.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {yesterdayMatches.map((m) => <FinishedMatchCard key={m.id} match={m} />)}
              </div>
            </div>
          )}

          {/* Tomorrow */}
          {tomorrowMatches.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Amanhã ({tomorrowMatches.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {tomorrowMatches.map((m) => <ScheduledMatchCard key={m.id} match={m} />)}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-muted text-center">Dados: ESPN · Football-Data.org</p>
    </div>
  );
}
