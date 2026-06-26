"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("splash-seen");
    if (seen) {
      setShow(false);
      return;
    }

    const timeout = setTimeout(() => dismiss(), 12000);
    return () => clearTimeout(timeout);
  }, []);

  function handleCanPlay() {
    setVideoReady(true);
    videoRef.current?.play().catch(() => dismiss());
  }

  function handleVideoEnd() {
    dismiss();
  }

  function dismiss() {
    setFadeOut(true);
    setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("splash-seen", "1");
    }, 800);
  }

  function toggleSound() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  }

  if (!show) return <>{children}</>;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: fadeOut ? 0 : 1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-[#060606] flex flex-col items-center justify-center gap-5"
            onClick={() => {
              if (muted && videoRef.current) {
                videoRef.current.muted = false;
                setMuted(false);
              }
            }}
          >
            {/* Video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: videoReady ? 1 : 0, scale: videoReady ? 1 : 0.92 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-[85vw] max-w-md md:max-w-xl lg:max-w-2xl rounded-2xl overflow-hidden shadow-2xl shadow-accent-purple/10"
            >
              <video
                ref={videoRef}
                src="/intro.mp4"
                muted
                playsInline
                preload="auto"
                onCanPlay={handleCanPlay}
                onEnded={handleVideoEnd}
                className="w-full h-auto block"
              />
            </motion.div>

            {/* Loading */}
            {!videoReady && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
                <span className="text-[10px] text-muted">Carregando...</span>
              </motion.div>
            )}

            {/* Controls */}
            {videoReady && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSound(); }}
                  className="text-muted hover:text-white text-xs font-medium transition-colors px-4 py-2 rounded-full border border-border hover:border-border-hover"
                >
                  {muted ? "🔇 Ativar som" : "🔊 Som ligado"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(); }}
                  className="text-muted hover:text-white text-xs font-medium transition-colors px-4 py-2 rounded-full border border-border hover:border-border-hover"
                >
                  Pular ›
                </button>
              </motion.div>
            )}

            {/* Tap hint on mobile */}
            {videoReady && muted && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-[10px] text-muted/50 md:hidden"
              >
                Toque para ativar o som
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={show ? "hidden" : ""}>
        {children}
      </div>
    </>
  );
}
