"use client";

import { useEffect } from "react";
import { audio } from "@/lib/audio";
import { experience } from "@/lib/experience";

/**
 * /reborn has no entry gate, so nothing ever unlocks the audio engine. This
 * starts it on the first user gesture: unlocks Web Audio, fades in the room-tone
 * + generative jazz bed, and flips `started` so the chip mute toggle appears.
 * One-shot. Individual cues (flip/hover/deal) are played at their call sites.
 */
export default function RebornAudio() {
  useEffect(() => {
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      audio.unlock();
      audio.startBed();
      experience.set({ started: true });
      remove();
    };
    const remove = () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("wheel", start);
    };
    window.addEventListener("pointerdown", start, { once: false });
    window.addEventListener("keydown", start);
    window.addEventListener("wheel", start, { passive: true });
    return remove;
  }, []);

  return null;
}
