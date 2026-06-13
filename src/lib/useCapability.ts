"use client";

import { useEffect, useState } from "react";

export type Capability = {
  reducedMotion: boolean;
  touch: boolean;
  lowPower: boolean; // few cores / coarse pointer — throttle post & physics
  ready: boolean;
};

/**
 * Single source of truth for a11y + device capability. Drives every fallback
 * path (static hero, 2D flips, no cursor mask, capped pixel ratio).
 */
export function useCapability(): Capability {
  const [cap, setCap] = useState<Capability>({
    reducedMotion: false,
    touch: false,
    lowPower: false,
    ready: false,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const cores = navigator.hardwareConcurrency || 4;
    const lowPower = cores <= 4 || touch;

    const update = () =>
      setCap({
        reducedMotion: mq.matches,
        touch,
        lowPower,
        ready: true,
      });

    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return cap;
}
