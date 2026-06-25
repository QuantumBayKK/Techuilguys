"use client";

import { motion } from "framer-motion";
import type { Project } from "@/data/projects";
import { CardFront } from "@/components/cards/CardFaces";
import ProjectMedia from "@/components/cards/ProjectMedia";
import ProjectLinks from "@/components/cards/ProjectLinks";
import GlowCard from "@/components/ui/spotlight-card";
import { useInView } from "@/lib/useInView";
import { inspect } from "@/lib/inspect";
import { audio } from "@/lib/audio";
import { handJitter } from "@/lib/seededNoise";

/**
 * One project, told as a hand-of-cards beat: the branded playing card on one
 * side, its hero art (or live SVG demo) + the build details on the other. Sides
 * alternate down the page. Media only animates while the row is on screen.
 */
export default function ProjectShowcase({
  project,
  number,
  flip,
}: {
  project: Project;
  /** 1-based position within the dealer's hand, for the editorial counter. */
  number: number;
  /** Mirror the layout (card on the right) for an alternating rhythm. */
  flip: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  // #1/#2 — stable "hand-dealt" imperfection: this card always lands a hair off
  // square, and its deal carries a tiny humanized delay. Seeded by id so it's
  // identical every render (imperfection, not a bug).
  const j = handJitter(project.id);

  return (
    <div
      ref={ref}
      className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-12 sm:gap-10 sm:py-20 lg:grid-cols-[minmax(0,300px)_1fr]"
    >
      {/* the card — idle 3D rotation, click to inspect */}
      <motion.div
        initial={{ opacity: 0, y: 60, rotate: j.rotate * 2.4, x: j.x }}
        whileInView={{ opacity: 1, y: 0, rotate: j.rotate, x: j.x }}
        viewport={{ once: true, margin: "-12%" }}
        transition={{ type: "spring", stiffness: 90, damping: 16, delay: j.delay }}
        className={`card-stage mx-auto w-[210px] sm:w-[260px] ${flip ? "lg:order-2" : ""}`}
      >
        <button
          type="button"
          data-cursor="Inspect"
          aria-label={`Inspect ${project.title}`}
          onClick={() => {
            audio.play("flip");
            inspect.open(project);
          }}
          className="card-rotor group block aspect-[3/4.4] w-full"
        >
          <div
            className="h-full w-full transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_30px_55px_rgba(0,0,0,0.7))_drop-shadow(0_0_26px_rgba(255,157,47,0.4))]"
            style={{ filter: "drop-shadow(0 30px 55px rgba(0,0,0,0.6))" }}
          >
            <CardFront project={project} />
          </div>
        </button>
        <span className="mt-3 block text-center font-display text-[10px] uppercase tracking-[0.35em] text-[var(--color-muted)] opacity-70">
          tap to inspect ⤢
        </span>
      </motion.div>

      {/* media + details */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-12%" }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className={flip ? "lg:order-1" : ""}
      >
        {/* cursor-reactive spotlight panel — the project's "stat sheet" */}
        <GlowCard
          customSize
          glowColor="orange"
          className="w-full !rounded-2xl !p-5 sm:!p-6"
        >
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-brass)]/70">
              {String(number).padStart(2, "0")} · {project.role}
            </p>
            <div className="mb-1 flex items-baseline gap-3">
              <span className="font-display text-2xl text-[var(--color-brass)]">
                {project.rank}
              </span>
              <h3 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                {project.title}
              </h3>
            </div>
            <p className="font-script mb-4 text-xl text-[var(--color-brass-bright)]">
              {project.subtitle}
            </p>

            {/* hero art (falls back to the live SVG demo) */}
            <ProjectMedia project={project} live={inView} />

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--color-ink)]/85">
              {project.blurb}
            </p>

            <div className="mt-4 space-y-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              <p>
                <span className="text-[var(--color-brass)]">Outcome · </span>
                {project.outcomes}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {project.skills.flatMap((g) => g.items).map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[var(--color-line-warm)] bg-[var(--color-neon-amber)]/5 px-2.5 py-0.5 text-[11px] tracking-wide text-[var(--color-ink)]"
                >
                  {s}
                </span>
              ))}
            </div>

            <ProjectLinks project={project} className="mt-6" />
          </div>
        </GlowCard>
      </motion.div>
    </div>
  );
}
