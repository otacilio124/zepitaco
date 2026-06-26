"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitPrediction } from "@/lib/prediction-actions";

type PredictionFormProps = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  existingHome?: number;
  existingAway?: number;
};

type Confetti = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: { x: number; y: number };
};

function ConfettiCanvas({ active, colors }: { active: boolean; colors: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Confetti[]>([]);
  const animRef = useRef<number>(0);

  const createParticles = useCallback(() => {
    const particles: Confetti[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        id: i,
        x: Math.random() * (canvasRef.current?.width || 400),
        y: -10 - Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: 2 + Math.random() * 4,
        },
      });
    }
    return particles;
  }, [colors]);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    particlesRef.current = createParticles();

    let frame = 0;
    const maxFrames = 120;

    function animate() {
      if (!ctx || !canvas || frame > maxFrames) {
        cancelAnimationFrame(animRef.current);
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.velocity.x;
        p.y += p.velocity.y;
        p.velocity.y += 0.1;
        p.rotation += 3;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      frame++;
      animRef.current = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, createParticles]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function ScoreButton({ onClick, label, size = "normal" }: { onClick: () => void; label: string; size?: "normal" | "large" }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      className={`rounded-xl bg-surface-2 border border-border text-white font-bold hover:border-accent-purple/40 hover:bg-surface-hover transition-colors ${
        size === "large" ? "h-10 w-10 md:h-12 md:w-12 text-lg md:text-xl" : "h-9 w-9 md:h-10 md:w-10 text-base md:text-lg"
      }`}
    >
      {label}
    </motion.button>
  );
}

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const confettiColors = ["#7c3aed", "#22c55e", "#eab308", "#ef4444", "#ffffff"];

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
      setShowConfetti(true);
      setSubmitted(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 md:p-6 lg:p-8 relative overflow-hidden">
      <ConfettiCanvas active={showConfetti} colors={confettiColors} />

      <div className="relative z-0">
        <h3 className="text-xs lg:text-sm font-semibold text-muted uppercase tracking-widest mb-5 md:mb-6 text-center">
          Seu Pitaco
        </h3>

        {/* Score selector */}
        <div className="flex items-center justify-center gap-3 md:gap-6 lg:gap-8">
          {/* Home team */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <span className="text-xs md:text-sm lg:text-base text-white font-medium text-center truncate w-full">
              {homeTeam}
            </span>
            <div className="flex items-center gap-2 md:gap-3">
              <ScoreButton onClick={() => setHomeScore(Math.max(0, homeScore - 1))} label="-" />
              <motion.span
                key={homeScore}
                initial={{ scale: 1.3, color: "#7c3aed" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="w-10 md:w-14 text-center text-3xl md:text-4xl lg:text-5xl font-bold"
              >
                {homeScore}
              </motion.span>
              <ScoreButton onClick={() => setHomeScore(homeScore + 1)} label="+" />
            </div>
          </div>

          {/* VS */}
          <div className="shrink-0">
            <span className="text-lg md:text-xl text-muted font-light">x</span>
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <span className="text-xs md:text-sm lg:text-base text-white font-medium text-center truncate w-full">
              {awayTeam}
            </span>
            <div className="flex items-center gap-2 md:gap-3">
              <ScoreButton onClick={() => setAwayScore(Math.max(0, awayScore - 1))} label="-" />
              <motion.span
                key={awayScore}
                initial={{ scale: 1.3, color: "#7c3aed" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="w-10 md:w-14 text-center text-3xl md:text-4xl lg:text-5xl font-bold"
              >
                {awayScore}
              </motion.span>
              <ScoreButton onClick={() => setAwayScore(awayScore + 1)} label="+" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 md:mt-8 max-w-xs mx-auto">
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full btn-primary py-3 md:py-3.5 disabled:opacity-50"
          >
            {loading ? "Salvando..." : existingHome !== undefined ? "Atualizar Pitaco" : "Confirmar Pitaco"}
          </motion.button>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-xs md:text-sm text-center mt-4 font-medium ${
                message.includes("!") ? "text-accent-green" : "text-accent-red"
              }`}
            >
              {submitted && message.includes("!") ? "🎉 " : ""}{message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
