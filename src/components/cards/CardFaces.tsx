"use client";

import type { Project, Suit } from "@/data/projects";

export const SUIT_GLYPH: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  clubs: "♣",
  diamonds: "♦",
};

export const isRed = (s: Suit) => s === "hearts" || s === "diamonds";

/** The branded card face — never a generic playing card. */
export function CardFront({ project }: { project: Project }) {
  const glyph = SUIT_GLYPH[project.suit];
  const red = isRed(project.suit);
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-4"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, #1b150f 0%, #0e0b08 60%, #080605 100%)",
        boxShadow: "inset 0 0 0 1px rgba(201,162,75,0.35)",
      }}
    >
      {/* corner index */}
      <Corner glyph={glyph} rank={project.rank} red={red} />
      <Corner glyph={glyph} rank={project.rank} red={red} flip />

      {/* guilloché brass frame */}
      <div className="pointer-events-none absolute inset-2 rounded-[10px] border border-[var(--color-brass)]/45" />
      <div className="pointer-events-none absolute inset-3 rounded-[8px] border border-[var(--color-brass)]/20" />

      {/* center emblem */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span
          className="font-display text-5xl"
          style={{ color: red ? "var(--color-neon-amber)" : "var(--color-brass)" }}
        >
          {glyph}
        </span>
        <p className="font-display mt-3 px-2 text-xl font-bold uppercase leading-tight tracking-tight text-[var(--color-ink)]">
          {project.title}
        </p>
        <p className="font-script mt-1 text-lg text-[var(--color-brass-bright)]">
          {project.subtitle}
        </p>
      </div>

      <p className="text-center font-display text-[9px] uppercase tracking-[0.4em] text-[var(--color-brass)]/70">
        Techuila Guys
      </p>
    </div>
  );
}

/** The back — what the project does + the tech-stack skill chips. */
export function CardBack({ project }: { project: Project }) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] p-5"
      style={{
        background:
          "linear-gradient(160deg, #14110c 0%, #0b0907 100%)",
        boxShadow: "inset 0 0 0 1px rgba(201,162,75,0.35)",
      }}
    >
      <div className="pointer-events-none absolute inset-2 rounded-[10px] border border-[var(--color-brass)]/30" />

      <p className="font-display text-lg font-bold uppercase tracking-tight text-[var(--color-neon-amber)]">
        {project.title}
      </p>
      <p className="font-script -mt-0.5 text-base text-[var(--color-brass-bright)]">
        {project.subtitle}
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-ink)]/85">
        {project.blurb}
      </p>

      <div className="mt-3 space-y-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
        <p>
          <span className="text-[var(--color-brass)]">Role · </span>
          {project.role}
        </p>
        <p>
          <span className="text-[var(--color-brass)]">Outcome · </span>
          {project.outcomes}
        </p>
      </div>

      <div className="mt-auto space-y-2 pt-3">
        {project.skills.map((g) => (
          <div key={g.group} data-chip-group>
            <p className="font-display mb-1 text-[9px] uppercase tracking-[0.3em] text-[var(--color-brass)]/80">
              {g.group}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((s) => (
                <span
                  key={s}
                  data-chip
                  className="rounded-full border border-[var(--color-line-warm)] bg-[var(--color-neon-amber)]/5 px-2 py-0.5 text-[10px] tracking-wide text-[var(--color-ink)]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Corner({
  glyph,
  rank,
  red,
  flip,
}: {
  glyph: string;
  rank: string;
  red: boolean;
  flip?: boolean;
}) {
  return (
    <div
      className={`absolute z-10 flex flex-col items-center leading-none ${
        flip ? "bottom-3 right-3 rotate-180" : "left-3 top-3"
      }`}
      style={{ color: red ? "var(--color-neon-amber)" : "var(--color-brass)" }}
    >
      <span className="font-display text-base font-bold">{rank}</span>
      <span className="text-xs">{glyph}</span>
    </div>
  );
}
