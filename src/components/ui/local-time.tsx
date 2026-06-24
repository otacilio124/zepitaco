"use client";

import { useEffect, useState } from "react";

type Props = {
  date: Date | string;
  format?: "time" | "date" | "datetime" | "full" | "short";
  className?: string;
};

export function LocalTime({ date, format = "time", className }: Props) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const d = new Date(date);
    const opts: Record<string, Intl.DateTimeFormatOptions> = {
      time: { hour: "2-digit", minute: "2-digit" },
      date: { day: "2-digit", month: "short" },
      datetime: { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" },
      full: { weekday: "long", day: "2-digit", month: "long", year: "numeric" },
      short: { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" },
    };
    setDisplay(d.toLocaleString("pt-BR", opts[format]));
  }, [date, format]);

  if (!display) {
    return <span className={className}>--:--</span>;
  }

  return <span className={className}>{display}</span>;
}
