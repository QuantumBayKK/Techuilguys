"use client";

/**
 * #59 — a neon "Techuila" sign with an irregular electrical flicker. The 'q'
 * is a half-dead tube that buzzes harder than the rest, like a real bar sign.
 */
export default function NeonSign() {
  return (
    <div className="pointer-events-none mx-auto mb-8 w-fit select-none" aria-hidden>
      <span className="font-script neon-sign text-4xl sm:text-6xl" style={{ color: "#ffd9a0" }}>
        Techui<span className="neon-dim">l</span>a
      </span>
    </div>
  );
}
