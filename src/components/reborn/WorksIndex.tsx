"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import type { Project } from "@/data/projects";
import { PROJECTS } from "@/data/projects";
import { dealerById } from "@/data/dealers";
import { inspect } from "@/lib/inspect";
import { audio } from "@/lib/audio";

/**
 * Reborn — the deck as an editorial index. A line per work; hovering lifts the
 * row and floats its hero-art beside the cursor (Baffait hover-preview). Click
 * opens the full inspect overlay. Touch devices just get the tappable rows.
 */
export default function WorksIndex() {
  const [active, setActive] = useState<Project | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 220, damping: 28, mass: 0.5 });
  const py = useSpring(my, { stiffness: 220, damping: 28, mass: 0.5 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <section id="rb-deck" className="relative py-[14vh]">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="misprint font-display text-[clamp(2rem,6vw,5rem)] font-bold uppercase leading-none tracking-tight">
            The&nbsp;deck
          </h2>
          <p className="font-display mb-2 text-[11px] uppercase tracking-[0.4em] text-[var(--color-brass)]">
            ({String(PROJECTS.length).padStart(2, "0")}) selected
          </p>
        </div>

        <div ref={wrapRef} onPointerMove={onMove} className="relative">
          {PROJECTS.map((p, i) => (
            <WorkRow
              key={p.id}
              project={p}
              index={i + 1}
              onEnter={() => setActive(p)}
              onLeave={() => setActive((cur) => (cur === p ? null : cur))}
            />
          ))}

          {/* cursor-tethered floating preview */}
          <motion.div
            aria-hidden
            style={{ x: px, y: py }}
            className="pointer-events-none absolute left-0 top-0 z-30 hidden sm:block"
          >
            <AnimatePresence>
              {active && (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                  animate={{ opacity: 1, scale: 1, rotate: -2 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="w-[380px] -translate-x-1/2 -translate-y-1/2"
                >
                  <Preview project={active} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** Floating hover preview — the real website frontend + the 2-line brief. */
function Preview({ project }: { project: Project }) {
  const [ok, setOk] = useState(false);
  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[var(--color-line-warm)] bg-gradient-to-br from-[var(--color-felt-deep)] via-[#0a0907] to-black shadow-[var(--shadow-table)]">
        {project.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image}
            alt={project.imageAlt ?? project.title}
            onLoad={() => setOk(true)}
            onError={() => setOk(false)}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
              ok ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        {!ok && (
          <span className="font-display absolute inset-0 grid place-items-center text-2xl font-bold uppercase tracking-tight text-[var(--color-brass)]/50">
            {project.title}
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-noir)]/70 to-transparent" />
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-snug text-[var(--color-muted)]">
        {project.blurb}
      </p>
    </div>
  );
}

function WorkRow({
  project,
  index,
  onEnter,
  onLeave,
}: {
  project: Project;
  index: number;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const suit = dealerById(project.dealer).suit;
  return (
    <motion.button
      type="button"
      data-cursor={project.live ? "Visit site ↗" : "Inspect"}
      onMouseEnter={() => {
        onEnter();
        audio.play("hover");
      }}
      onMouseLeave={onLeave}
      onClick={() => {
        audio.play("flip");
        if (project.live) window.open(project.live, "_blank", "noopener");
        else inspect.open(project);
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, delay: index * 0.04 }}
      className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 border-t border-[var(--color-line)] py-6 text-left transition-colors hover:border-[var(--color-line-warm)] sm:gap-8 sm:py-8"
    >
      <span className="font-mono text-xs text-[var(--color-faint)] sm:text-sm">
        {String(index).padStart(2, "0")}
      </span>

      <div className="flex min-w-0 items-baseline gap-3 sm:gap-5">
        <span className="font-display shrink-0 text-base text-[var(--color-brass)] sm:text-xl">
          {project.rank}
          {suit}
        </span>
        <span className="font-display truncate text-[clamp(1.6rem,5.5vw,4rem)] font-bold uppercase leading-none tracking-tight text-[var(--color-ink)] transition-all duration-300 group-hover:translate-x-2 group-hover:text-[var(--color-neon-amber)]">
          {project.title}
        </span>
        <span className="font-script hidden translate-y-1 text-lg text-[var(--color-brass-bright)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:inline">
          {project.subtitle}
        </span>
      </div>

      <span className="flex items-center gap-4 whitespace-nowrap text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted)] sm:text-[11px]">
        <span className="hidden sm:inline">{project.role}</span>
        <span className="text-[var(--color-brass)] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
          ↗
        </span>
      </span>
    </motion.button>
  );
}
