"use client";

import { useSyncExternalStore } from "react";
import type { Project } from "@/data/projects";

/**
 * Which project is currently lifted into the full-screen inspector (drag to
 * rotate, flip to read the build). A tiny external store so any card can open
 * it and the single overlay can read it without prop-drilling.
 */
let current: Project | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const inspect = {
  get: () => current,
  open(p: Project) {
    current = p;
    emit();
  },
  close() {
    current = null;
    emit();
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};

export function useInspect(): Project | null {
  return useSyncExternalStore(inspect.subscribe, inspect.get, inspect.get);
}
