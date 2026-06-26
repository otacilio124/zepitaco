"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("splash-seen");
    if (seen) {
      setShow(false);
      return;
    }
  }, []);

  function handleCanPlay() {
    setVideoReady(true);
    videoRef.current?.play().catch(() => {
      dismiss();
    });
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

  if (!show) return <>{children}</>;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: fadeOut ? 0 : 1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-[#060606] flex flex-col items-center justify-center"
          >
            {/* Video container - centered and sized */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: videoReady ? 1 : 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-[85vw] max-w-lg md:max-w-xl lg:max-w-2xl rounded-2xl overflow-hidden shadow-2xl shadow-accent-purple/10"
            >
              <video
                ref={videoRef}
                src="/intro.mp4"
                muted
                playsInline
                preload="auto"
                onCanPlay={handleCanPlay}
                onEnded={handleVideoEnd}
                className="w-full h-auto"
              />
            </motion.div>

            {/* Loading indicator before video ready */}
            {!videoReady && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="h-8 w-8 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
                <span className="text-xs text-muted">Carregando...</span>
              </motion.div>
            )}

            {/* Skip button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: videoReady ? 1 : 0 }}
              transition={{ delay: 1.5 }}
              onClick={dismiss}
              className="mt-6 text-muted hover:text-white text-xs md:text-sm font-medium transition-colors px-5 py-2 rounded-full border border-border hover:border-border-hover"
            >
              Pular
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={show ? "hidden" : ""}>
        {children}
      </div>
    </>
  );
}
