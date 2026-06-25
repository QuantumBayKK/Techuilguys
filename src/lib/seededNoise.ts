/**
 * Stable, seeded pseudo-randomness — the backbone of every "minute imperfection"
 * on the site. The whole point of hand-made imperfection is that it must be the
 * SAME every render, or it reads as a bug instead of a human touch. So nothing
 * here ever calls Math.random(): you pass a seed (a card id, an index, a name)
 * and always get the same value back.
 *
 *   jitter("ace-of-spades")  → always the same tiny rotation for that card
 *   jitter("king-of-hearts") → a different but equally-stable rotation
 *
 * Implementation: a tiny xmur3 string hash → mulberry32 PRNG. Fast, no deps.
 */

/** Hash an arbitrary string seed into a 32-bit integer. */
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** A deterministic 0..1 generator seeded by a string. Call it for a stream. */
export function rng(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One stable float in [min,max] for a seed (single draw). */
export function seededRange(seed: string, min: number, max: number): number {
  return min + rng(seed)() * (max - min);
}

/**
 * The signature "hand-dealt" transform for a card. Returns a tiny, stable
 * rotation / offset / deal-delay so no two cards ever sit perfectly square and
 * the deal never feels like a metronome — yet it's identical on every render.
 *
 * Tunables are intentionally small (degrees / px) — imperfection, not chaos.
 */
export type HandJitter = {
  /** degrees, ~[-1.6, 1.6] */
  rotate: number;
  /** px horizontal, ~[-3, 3] */
  x: number;
  /** px vertical, ~[-2, 2] */
  y: number;
  /** seconds of extra, humanized deal delay, ~[0, 0.09] */
  delay: number;
};

export function handJitter(seed: string, strength = 1): HandJitter {
  const r = rng(seed);
  return {
    rotate: (r() * 2 - 1) * 1.6 * strength,
    x: (r() * 2 - 1) * 3 * strength,
    y: (r() * 2 - 1) * 2 * strength,
    delay: r() * 0.09 * strength,
  };
}

/** Pick a stable element from a list for a given seed (e.g. which patter line). */
export function seededPick<T>(seed: string, list: readonly T[]): T {
  return list[Math.floor(rng(seed)() * list.length) % list.length];
}
