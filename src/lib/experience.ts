"use client";

import { useSyncExternalStore } from "react";
import type { DealerId } from "@/data/dealers";

/**
 * The whole home experience is one directed state machine. Both the WebGL
 * scene (inside the R3F reconciler) and the DOM HUD read/write it through this
 * external store — plain subscriptions, no shared React context across the
 * Canvas boundary.
 *
 *  gate    → entry / audio unlock
 *  intro   → chip spin → roll → drop → table reveal cinematic
 *  dealers → pick a dealer
 *  dealt   → five cards fanned in POV
 *  inspect → one card lifted, artifact mode
 *  body    → scrolled past the table into the site
 */
export type Stage =
  | "gate"
  | "intro"
  | "dealers"
  | "dealt"
  | "inspect"
  | "body";

export type ExperienceState = {
  stage: Stage;
  dealer: DealerId | null;
  inspectId: string | null;
  loaded: number; // 0..1 preload progress
};

let state: ExperienceState = {
  stage: "gate",
  dealer: null,
  inspectId: null,
  loaded: 0,
};

const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const experience = {
  get: () => state,
  set(patch: Partial<ExperienceState>) {
    state = { ...state, ...patch };
    emit();
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};

export function useExperience(): ExperienceState {
  return useSyncExternalStore(
    experience.subscribe,
    experience.get,
    experience.get
  );
}
