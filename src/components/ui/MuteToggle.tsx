"use client";

import { useState } from "react";
import { audio } from "@/lib/audio";
import { useExperience } from "@/lib/experience";

/** Persistent mute control — appears only after the entry gesture. */
export default function MuteToggle() {
  const { stage } = useExperience();
  const [muted, setMuted] = useState(false);
  if (stage === "gate") return null;

  return (
    <button
      data-cursor={muted ? "Unmute" : "Mute"}
      data-magnetic
      onClick={() => setMuted(audio.toggleMute())}
      aria-label={muted ? "Unmute" : "Mute"}
      className="fixed right-5 top-5 z-[80] flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-noir-2)]/70 px-3 py-2 backdrop-blur transition-colors hover:border-[var(--color-line-warm)]"
    >
      <span className="flex h-3 w-3 items-end gap-[2px]">
        {[0.5, 1, 0.7].map((h, i) => (
          <span
            key={i}
            className="w-[2px] rounded-full bg-[var(--color-neon-amber)] transition-transform"
            style={{
              height: `${h * 100}%`,
              transform: muted ? "scaleY(0.25)" : undefined,
            }}
          />
        ))}
      </span>
      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
        {muted ? "Muted" : "Sound"}
      </span>
    </button>
  );
}
