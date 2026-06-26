"use client";

import { useState, useEffect, useRef } from "react";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const played = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("splash-seen")) {
      setDone(true);
      return;
    }

    const video = videoRef.current;
    if (!video) { finish(); return; }

    function attemptPlay() {
      if (played.current || !video) return;
      played.current = true;

      const promise = video.play();
      if (promise !== undefined) {
        promise.then(() => {
          // Playing successfully
        }).catch(() => {
          // Autoplay blocked — try once on user interaction
          function onTouch() {
            video?.play().catch(() => finish());
            document.removeEventListener("touchstart", onTouch);
            document.removeEventListener("click", onTouch);
          }
          document.addEventListener("touchstart", onTouch, { once: true });
          document.addEventListener("click", onTouch, { once: true });
        });
      }
    }

    video.addEventListener("canplaythrough", attemptPlay);
    video.load();

    // Also try after a short delay in case canplaythrough already fired
    setTimeout(() => {
      if (!played.current) attemptPlay();
    }, 500);

    const fallback = setTimeout(() => finish(), 10000);
    return () => clearTimeout(fallback);
  }, []);

  function finish() {
    if (done) return;
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
        <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56">
          <video
            ref={videoRef}
            src="/intro.mp4"
            muted
            playsInline
            preload="auto"
            onEnded={finish}
            onError={finish}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      <div className="hidden">{children}</div>
    </>
  );
}
