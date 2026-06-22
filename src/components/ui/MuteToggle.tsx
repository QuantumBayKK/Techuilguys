"use client";

import { useState } from "react";
import { audio } from "@/lib/audio";
import { useExperience } from "@/lib/experience";

/**
 * Sound control, styled as a miniature poker chip rather than a generic UI
 * widget — beveled cream/brass body, twelve edge spots, an engraved speaker
 * that gains sound-waves when on and a slash when muted. The chip turns slowly
 * while sound plays and rests when muted. Appears only after the entry gesture.
 */
export default function MuteToggle() {
  const { started } = useExperience();
  const [muted, setMuted] = useState(false);
  if (!started) return null;

  return (
    <button
      data-cursor={muted ? "Unmute" : "Mute"}
      data-magnetic
      onClick={() => setMuted(audio.toggleMute())}
      aria-label={muted ? "Unmute" : "Mute"}
      className="group fixed right-4 top-4 z-[80] grid h-12 w-12 place-items-center sm:right-5 sm:top-5"
    >
      <svg
        viewBox="0 0 48 48"
        className="h-11 w-11 drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-110"
        style={{ opacity: muted ? 0.62 : 1 }}
      >
        <defs>
          <radialGradient id="chipBody" cx="40%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#fff8e8" />
            <stop offset="45%" stopColor="#e9e1cf" />
            <stop offset="74%" stopColor="#cdbf9f" />
            <stop offset="100%" stopColor="#a98f63" />
          </radialGradient>
        </defs>

        {/* spinning chip body (rests when muted) */}
        <g className={muted ? "" : "chip-turn"} style={{ transformOrigin: "24px 24px" }}>
          <circle cx="24" cy="24" r="22" fill="url(#chipBody)" stroke="#8a6f2f" strokeWidth="0.75" />
          {/* edge spots */}
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x="22.4"
              y="1.6"
              width="3.2"
              height="6"
              rx="1.2"
              fill={i % 2 === 0 ? "#c9a24b" : "#b6a378"}
              transform={`rotate(${i * 30} 24 24)`}
            />
          ))}
          {/* inner rings */}
          <circle cx="24" cy="24" r="16.5" fill="none" stroke="#c9a24b" strokeWidth="1.4" opacity="0.8" />
          <circle cx="24" cy="24" r="13.5" fill="none" stroke="#e9e1cf" strokeWidth="0.8" opacity="0.7" />
        </g>

        {/* engraved speaker (does not spin) */}
        <g fill="#1a1410">
          <path d="M18 21 h3.4 L26 16.8 v14.4 L21.4 27 H18 z" />
        </g>
        {!muted ? (
          <g stroke="#1a1410" strokeWidth="1.7" fill="none" strokeLinecap="round" className="snd-wave">
            <path d="M29 19.5 a6 6 0 0 1 0 9" />
            <path d="M31.6 16.8 a10 10 0 0 1 0 14.4" />
          </g>
        ) : (
          <line x1="16.5" y1="16.5" x2="31.5" y2="31.5" stroke="#7a2230" strokeWidth="2.4" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
