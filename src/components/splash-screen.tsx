"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("splash-seen");
    if (seen) {
      setShow(false);
      return;
    }

    const timer = setTimeout(() => {
      setVideoEnded(true);
      setTimeout(() => {
        setShow(false);
        sessionStorage.setItem("splash-seen", "1");
      }, 600);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  function handleVideoEnd() {
    setVideoEnded(true);
    setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("splash-seen", "1");
    }, 600);
  }

  function handleSkip() {
    setVideoEnded(true);
    setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("splash-seen", "1");
    }, 300);
  }

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <video
              ref={videoRef}
              src="/intro.mp4"
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                videoEnded ? "opacity-0" : "opacity-100"
              }`}
            />

            <button
              onClick={handleSkip}
              className="absolute bottom-8 right-8 md:bottom-12 md:right-12 text-white/50 hover:text-white text-xs md:text-sm font-medium transition-colors z-10 backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full"
            >
              Pular ›
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={show ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
        {children}
      </div>
    </>
  );
}
