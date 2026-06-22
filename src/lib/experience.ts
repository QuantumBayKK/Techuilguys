"use client";

import { useSyncExternalStore } from "react";
import type { DealerId } from "@/data/dealers";

/**
 * The experience is now a single scroll story. There is exactly ONE decision
 * the visitor makes — which dealer deals them in — and the page scroll is held
 * at that moment until they pick. Everything else is pure scroll.
 *
 *  dealer  : null until the visitor clicks Kailosh or Keni, then their id.
 *            Picking unlocks the rest of the page (the hand + the lounge).
 *  started : true once any user gesture has happened (used to unlock audio).
 */
export type ExperienceState = {
  dealer: DealerId | null;
  started: boolean;
};

let state: ExperienceState = {
  dealer: null,
  started: false,
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
