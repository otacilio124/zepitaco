"use client";

import { useState } from "react";
import { submitPrediction } from "@/lib/prediction-actions";

type PredictionFormProps = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  existingHome?: number;
  existingAway?: number;
};

export function PredictionForm({
  matchId,
  homeTeam,
  awayTeam,
  existingHome,
  existingAway,
}: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState(existingHome ?? 0);
  const [awayScore, setAwayScore] = useState(existingAway ?? 0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.set("matchId", String(matchId));
    formData.set("homeScore", String(homeScore));
    formData.set("awayScore", String(awayScore));

    const result = await submitPrediction(formData);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(result.updated ? "Palpite atualizado!" : "Palpite registrado!");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-card-bg border border-card-border p-5 space-y-4">
      <h3 className="text-sm font-medium text-muted">Seu palpite</h3>

      <div className="flex items-center justify-center gap-4">
        <div className="text-right flex-1">
          <span className="text-sm text-white font-medium">{homeTeam}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
            className="h-8 w-8 rounded-lg bg-card-border text-white hover:bg-accent-purple/30 transition-colors text-lg"
          >
            -
          </button>
          <span className="w-10 text-center text-2xl font-bold text-accent-green">{homeScore}</span>
          <button
            type="button"
            onClick={() => setHomeScore(homeScore + 1)}
            className="h-8 w-8 rounded-lg bg-card-border text-white hover:bg-accent-purple/30 transition-colors text-lg"
          >
            +
          </button>
        </div>

        <span className="text-muted text-lg">x</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
            className="h-8 w-8 rounded-lg bg-card-border text-white hover:bg-accent-purple/30 transition-colors text-lg"
          >
            -
          </button>
          <span className="w-10 text-center text-2xl font-bold text-accent-yellow">{awayScore}</span>
          <button
            type="button"
            onClick={() => setAwayScore(awayScore + 1)}
            className="h-8 w-8 rounded-lg bg-card-border text-white hover:bg-accent-purple/30 transition-colors text-lg"
          >
            +
          </button>
        </div>

        <div className="text-left flex-1">
          <span className="text-sm text-white font-medium">{awayTeam}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full gradient-spectrum rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Salvando..." : existingHome !== undefined ? "Atualizar Palpite" : "Confirmar Palpite"}
      </button>

      {message && (
        <p className={`text-xs text-center ${message.includes("!") ? "text-accent-green" : "text-accent-red"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
