"use client";

import { useState, useEffect, useRef } from "react";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const triedPlay = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("splash-seen")) {
      setDone(true);
      return;
    }

    function tryPlay() {
      if (triedPlay.current || !videoRef.current) return;
      triedPlay.current = true;
      const p = videoRef.current.play();
      if (p && p.catch) {
        p.catch(() => finish());
      }
    }

    if (videoRef.current) {
      videoRef.current.addEventListener("loadeddata", tryPlay);
      videoRef.current.load();
    }

    const fallback = setTimeout(() => finish(), 8000);
    return () => clearTimeout(fallback);
  }, []);

  function finish() {
    setOpacity(0);
    setTimeout(() => {
      setDone(true);
      sessionStorage.setItem("splash-seen", "1");
    }, 500);
  }

  if (done) return <>{children}</>;

  return (
    <>
      <div
        style={{ opacity, transition: "opacity 0.5s ease" }}
        className="fixed inset-0 z-[100] bg-[#060606] flex items-center justify-center"
      >
        <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center">
          <video
            ref={videoRef}
            src="/intro.mp4"
            muted
            playsInline
            preload="auto"
            onEnded={finish}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      <div className="hidden">{children}</div>
    </>
  );
}
