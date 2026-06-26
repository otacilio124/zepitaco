"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("splash-seen");
    if (seen) { setShow(false); return; }
    const timeout = setTimeout(() => dismiss(), 10000);
    return () => clearTimeout(timeout);
  }, []);

  function dismiss() {
    setFadeOut(true);
    setTimeout(() => { setShow(false); sessionStorage.setItem("splash-seen", "1"); }, 600);
  }

  if (!show) return <>{children}</>;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            animate={{ opacity: fadeOut ? 0 : 1 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] bg-[#060606] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-[70vw] max-w-xs md:max-w-sm rounded-xl overflow-hidden"
            >
              <video
                ref={videoRef}
                src="/intro.mp4"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={dismiss}
                className="w-full h-auto block"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={show ? "hidden" : ""}>{children}</div>
    </>
  );
}
