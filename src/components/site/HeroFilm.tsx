"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/**
 * The studio film: an 8-second silent loop of our real product screens.
 *
 * Poster first, always. The video is only attached after the page has loaded,
 * and never for reduced motion, Save-Data or small screens — those keep the
 * still. Playback pauses when the tile leaves the viewport or the tab is hidden,
 * and there's a visible pause control.
 */
const POSTER_AT = 4.6; // the poster is this frame, so playback continues from it

export default function HeroFilm({ label }: { label: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const ok =
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      nav.connection?.saveData !== true &&
      window.matchMedia("(min-width: 768px)").matches;
    if (!ok) return;
    const attach = () => setEnabled(true);
    if (document.readyState === "complete") attach();
    else window.addEventListener("load", attach, { once: true });
    return () => window.removeEventListener("load", attach);
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!enabled || !v) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !userPaused) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [enabled, userPaused]);

  return (
    <div className="relative h-full min-h-[260px] overflow-hidden rounded-[20px] bg-night">
      {/* eslint-disable-next-line @next/next/no-img-element -- poster must paint before any JS */}
      <img
        src="/film/hero-poster.webp"
        alt="Our product screens: a desktop web app beside a mobile app"
        width={1920}
        height={1080}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {enabled && (
        <video
          ref={video}
          muted
          playsInline
          loop
          preload="metadata"
          poster="/film/hero-poster.webp"
          aria-hidden
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = POSTER_AT;
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/film/hero.webm" type="video/webm" />
          <source src="/film/hero.mp4" type="video/mp4" />
        </video>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night/90 to-transparent" />
      <span className="eyebrow absolute bottom-4 left-5">{label}</span>
      {enabled && (
        <button
          type="button"
          onClick={() => {
            const v = video.current;
            if (!v) return;
            if (v.paused) {
              setUserPaused(false);
              v.play().catch(() => {});
            } else {
              setUserPaused(true);
              v.pause();
            }
          }}
          aria-label={playing ? "Pause the film" : "Play the film"}
          className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
        </button>
      )}
    </div>
  );
}
