"use client";

import { useEffect, useRef, useState } from "react";

type HeroVideoBackgroundProps = {
  videoIds: string[];
};

export function HeroVideoBackground({ videoIds }: HeroVideoBackgroundProps) {
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const revealTimerRef = useRef<number | null>(null);
  const playlistKey = videoIds.join(",");

  if (videoIds.length === 0) {
    return null;
  }

  useEffect(() => {
    setLoaded(false);
    setRevealed(false);
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    return () => {
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [playlistKey]);

  function handleLoad() {
    setLoaded(true);
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
    }
    // 스피너가 먼저 사라질 시간을 확보한 뒤 페이드 인합니다.
    revealTimerRef.current = window.setTimeout(() => {
      setRevealed(true);
      revealTimerRef.current = null;
    }, 700);
  }

  return (
    <div className="video-wrap absolute inset-0 z-0 overflow-hidden">
      <iframe
        className={[
          "video-iframe pointer-events-none transition-opacity duration-700",
          revealed ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{ visibility: loaded ? "visible" : "hidden" }}
        src={[
          `https://www.youtube.com/embed/${videoIds[0]}`,
          `?autoplay=1`,
          `&mute=1`,
          `&loop=1`,
          `&playlist=${videoIds.join(",")}`,
          `&controls=0`,
          `&showinfo=0`,
          `&disablekb=1`,
          `&iv_load_policy=3`,
          `&modestbranding=1`,
          `&rel=0`,
        ].join("")}
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="hero background video"
        onLoad={handleLoad}
      />
      <div
        className={[
          "absolute inset-0 bg-slate-950 transition-opacity duration-700",
          revealed ? "opacity-0" : "opacity-100",
        ].join(" ")}
      />
    </div>
  );
}
