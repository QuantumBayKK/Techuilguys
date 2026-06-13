/**
 * Global scroll-velocity signal.
 *
 * Lenis updates `velocity` every frame (see SmoothScroll). WebGL shaders and
 * components read it imperatively each frame to drive distortion / RGB-split.
 * Kept as a plain module singleton so the hot path never touches React state.
 */
type Signal = {
  velocity: number; // normalized, eased scroll velocity (~ -2..2)
  raw: number; // raw Lenis velocity
  progress: number; // 0..1 page scroll progress
  direction: 1 | -1 | 0;
};

export const scroll: Signal = {
  velocity: 0,
  raw: 0,
  progress: 0,
  direction: 0,
};

const subs = new Set<(s: Signal) => void>();

export function setScroll(partial: Partial<Signal>) {
  Object.assign(scroll, partial);
  subs.forEach((fn) => fn(scroll));
}

export function onScroll(fn: (s: Signal) => void) {
  subs.add(fn);
  return () => subs.delete(fn);
}
