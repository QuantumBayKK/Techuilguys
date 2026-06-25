"use client";

import { useEffect, useRef } from "react";
import { IDLE_WHISPERS } from "@/lib/dealerPatter";
import { seededPick } from "@/lib/seededNoise";
import { useCapability } from "@/lib/useCapability";

/**
 * #40 / #78 — the idle "tell". If the pointer sits still for a beat, a faint
 * handwritten line ("Your move.") fades in just below the cursor, then clears
 * the moment they move again. Picks a stable line per session so it isn't
 * jumpy. Pointer-only; respects reduced-motion by simply not showing.
 */
const IDLE_MS = 8000;

export default function IdleTell() {
  const el = useRef<HTMLDivElement>(null);
  const cap = useCapability();

  useEffect(() => {
    if (!cap.ready || cap.touch || cap.reducedMotion) return;
    const node = el.current;
    if (!node) return;

    let timer = 0;
    let last = { x: innerWidth / 2, y: innerHeight / 2 };
    // one stable line per page load (seed varies by load via the timer id space)
    let line = seededPick(String(performance.now() | 0), IDLE_WHISPERS);

    const hide = () => node.setAttribute("data-show", "false");
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        line = seededPick(String((last.x * 31 + last.y) | 0), IDLE_WHISPERS);
        node.textContent = line;
        node.style.left = `${last.x + 18}px`;
        node.style.top = `${last.y + 22}px`;
        node.setAttribute("data-show", "true");
      }, IDLE_MS);
    };

    const onMove = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
      hide();
      arm();
    };

    window.addEventListener("pointermove", onMove);
    arm();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.clearTimeout(timer);
    };
  }, [cap.ready, cap.touch, cap.reducedMotion]);

  if (cap.touch) return null;
  return <div ref={el} className="idle-whisper" aria-hidden data-show="false" />;
}
