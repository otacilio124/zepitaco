import { getMatchesByDate as getMatchesByDay } from "@/lib/queries";
import Link from "next/link";
import { TeamFlag } from "@/components/ui/team-flag";
import { LocalTime } from "@/components/ui/local-time";
import { getCountryName } from "@/lib/country-codes";

function generateDays(): { date: Date; label: string; key: string }[] {
  const days = [];
  const start = new Date("2026-06-11");
  const end = new Date("2026-07-19");
  const now = new Date();

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    days.push({
      date,
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      key: date.toISOString().split("T")[0],
    });
  }

  if (now < start || now > end) {
    days.unshift({
      date: now,
      label: "Hoje",
      key: now.toISOString().split("T")[0],
    });
  }

  return days;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const selectedDate = params.date ? new Date(params.date + "T00:00:00") : today;
  const selectedKey = selectedDate.toISOString().split("T")[0];
  const days = generateDays();
  const dayMatches = await getMatchesByDay(selectedDate);

  const selectedLabel = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">
          Calendário
        </h1>
        <p className="text-sm text-muted mt-1">
          Navegue pelos jogos da Copa do Mundo 2026
        </p>
      </div>

      {/* Day picker */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
        {days.map((day) => {
          const isSelected = day.key === selectedKey;
          const isToday = day.key === today.toISOString().split("T")[0];
          return (
            <Link
              key={day.key}
              href={`/dashboard/calendar?date=${day.key}`}
              className={`shrink-0 snap-start px-4 py-2.5 rounded-xl text-center transition-all ${
                isSelected
                  ? "gradient-spectrum text-white"
                  : "card text-muted hover:text-white"
              }`}
            >
              <div className="text-xs font-bold">{day.label}</div>
              {isToday && !isSelected && (
                <div className="h-1 w-1 rounded-full bg-accent-red mx-auto mt-1" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Selected day label */}
      <p className="text-sm text-muted-light capitalize">{selectedLabel}</p>

      {/* Matches */}
      {dayMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dayMatches.map((match) => {
            return (
              <Link
                key={match.matchId}
                href={`/dashboard/matches/${match.matchId}`}
                className="card card-interactive block p-4"
              >
                <div className="flex items-center justify-between text-xs mb-3">
                  <LocalTime date={match.matchDate} format="time" className="text-muted" />
                  {match.status === "live" && (
                    <span className="flex items-center gap-1.5 text-accent-red font-bold">
                      <span className="h-2 w-2 rounded-full bg-accent-red live-pulse" />
                      AO VIVO
                    </span>
                  )}
                  {match.status === "finished" && (
                    <span className="text-muted">Encerrado</span>
                  )}
                  {match.status === "scheduled" && (
                    <span className="text-accent-green">Agendado</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <TeamFlag name={match.homeTeam} size={28} />
                    <span className="text-sm font-semibold text-white truncate">
                      {getCountryName(match.homeTeam)}
                    </span>
                  </div>
                  <div className="px-4 text-center shrink-0">
                    {match.status === "scheduled" ? (
                      <span className="text-lg text-muted font-mono">vs</span>
                    ) : (
                      <span className="text-xl font-bold text-white">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                    <span className="text-sm font-semibold text-white truncate text-right">
                      {getCountryName(match.awayTeam)}
                    </span>
                    <TeamFlag name={match.awayTeam} size={28} />
                  </div>
                </div>

                <div className="text-center mt-2">
                  <span className="text-[10px] text-accent-purple">Ver análise →</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-muted">Nenhum jogo da Copa neste dia</p>
        </div>
      )}
    </div>
  );
}
