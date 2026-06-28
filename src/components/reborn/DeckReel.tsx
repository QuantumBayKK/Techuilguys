"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import type { Project } from "@/data/projects";
import { PROJECTS } from "@/data/projects";
import { dealerById } from "@/data/dealers";
import { inspect } from "@/lib/inspect";
import { audio } from "@/lib/audio";
import { handJitter } from "@/lib/seededNoise";

/**
 * Reborn — the riffle, told as a hand being played. The deck sweeps sideways as
 * you scroll (pinned on desktop), and a single story is woven through the six
 * cards: connect → see → remember → secure → prove → build. The centred card
 * focuses (scales up, brightens) and the story rail below tracks the beat.
 * Phones / reduced-motion get a native swipe strip.
 */

/** The rail beat per card = the project's 2-line brief (what we built). */
const STORY = PROJECTS.map((p) => ({ chapter: p.title, beat: p.blurb }));

export default function DeckReel() {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)"
    );
    const set = () => setPinned(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  return pinned ? <Pinned /> : <Strip />;
}

function Heading({ active }: { active: number }) {
  const s = STORY[active] ?? STORY[0];
  return (
    <div className="mx-auto flex w-full max-w-6xl items-end justify-between px-6 pt-[7vh] sm:px-10">
      <h2 className="misprint font-display text-[clamp(1.8rem,5.5vw,4.5rem)] font-bold uppercase leading-none tracking-tight">
        Riffle&nbsp;the&nbsp;deck
      </h2>
      <div className="hidden text-right sm:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-faint)]">
          Chapter {String(active + 1).padStart(2, "0")} / {String(STORY.length).padStart(2, "0")}
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={s.chapter}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3 }}
            className="font-display text-[13px] uppercase tracking-[0.4em] text-[var(--color-neon-amber)]"
          >
            {s.chapter}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Desktop: pinned, scroll-scrubbed horizontal sweep (measured in px). */
function Pinned() {
  const ref = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxX]);
  // sweep velocity → warp the rail and split each card's channels
  const velocity = useVelocity(scrollYProgress);
  const skewX = useSpring(useTransform(velocity, [-1.5, 0, 1.5], [6, 0, -6], { clamp: true }), {
    stiffness: 250,
    damping: 30,
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(STORY.length - 1, Math.max(0, Math.round(v * (STORY.length - 1))));
    setActive((cur) => {
      if (cur === idx) return cur;
      audio.play("deal"); // soft card-slide as the next card lands
      return idx;
    });
  });

  useEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      if (!rail) return;
      setMaxX(Math.max(0, rail.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (railRef.current) ro.observe(railRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section id="rb-riffle" ref={ref} className="relative h-[380vh]">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* #4 — living felt grain breathing under the table */}
        <div className="felt-grain pointer-events-none absolute inset-0 -z-10" aria-hidden />
        <Heading active={active} />

        <div className="flex flex-1 items-center overflow-hidden">
          <motion.div
            ref={railRef}
            style={{ x, skewX }}
            className="relative flex w-max items-center gap-[1.6vw] px-[3vw]"
          >
            {/* the woven thread running through every card */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[3vw] right-[3vw] top-1/2 h-px -translate-y-1/2"
              style={{
                background:
                  "repeating-linear-gradient(90deg, var(--color-line-warm) 0 14px, transparent 14px 26px)",
              }}
            />
            {PROJECTS.map((p, i) => (
              <ReelCard
                key={p.id}
                project={p}
                index={i}
                focused={i === active}
                vel={velocity}
                className="h-[clamp(330px,54vh,620px)] aspect-[3/4]"
              />
            ))}
            <TrailingPanel className="h-[clamp(330px,54vh,620px)] aspect-[3/4]" />
          </motion.div>
        </div>

        <StoryRail active={active} />
      </div>
    </section>
  );
}

/** The story rail: nodes that light up + the active beat. */
function StoryRail({ active }: { active: number }) {
  const s = STORY[active] ?? STORY[0];
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-[5vh]">
      <div className="mb-3 flex items-center justify-center gap-2">
        {STORY.map((_, i) => (
          <span key={i} className="flex items-center gap-2">
            <motion.span
              animate={{
                width: i === active ? 26 : 8,
                backgroundColor:
                  i <= active ? "var(--color-neon-amber)" : "var(--color-line-warm)",
              }}
              className="block h-1 rounded-full"
            />
          </span>
        ))}
      </div>
      <div className="h-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={s.beat}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="text-center text-sm leading-relaxed text-[var(--color-muted)]"
          >
            {s.beat}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Mobile / reduced-motion: native swipe strip with the beat on each card. */
function Strip() {
  return (
    <section id="rb-riffle" className="relative py-20">
      <Heading active={0} />
      <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] sm:gap-6 sm:px-10">
        {PROJECTS.map((p, i) => (
          <ReelCard
            key={p.id}
            project={p}
            index={i}
            focused
            showBeat
            className="aspect-[3/4] w-[74vw] sm:w-[44vw]"
          />
        ))}
        <TrailingPanel className="aspect-[3/4] w-[74vw] sm:w-[44vw]" />
      </div>
    </section>
  );
}

function TrailingPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`grid shrink-0 place-items-center ${className}`}>
      <p className="font-display max-w-xs text-center text-2xl uppercase leading-tight tracking-tight text-[var(--color-muted)]">
        Six works.
        <br />
        <span className="text-[var(--color-neon-amber)]">One hand.</span>
        <br />
        Now you&apos;ve seen it played.
      </p>
    </div>
  );
}

function ReelCard({
  project,
  index,
  focused = true,
  showBeat = false,
  vel,
  className = "",
}: {
  project: Project;
  index: number;
  focused?: boolean;
  showBeat?: boolean;
  vel?: MotionValue<number>;
  className?: string;
}) {
  const suit = dealerById(project.dealer).suit;
  const story = STORY[index] ?? STORY[0];
  const [imgOk, setImgOk] = useState(false);
  const [hover, setHover] = useState(false);
  // #1/#2 — hand-dealt jitter: a stable, tiny off-square + humanized deal delay
  const jitter = handJitter(`reel-${project.id}`);

  // velocity-driven chromatic aberration (RGB split) on the card edges
  const fallbackVel = useMotionValue(0);
  const v = vel ?? fallbackVel;
  const aberration = useTransform(v, (val) => {
    const a = Math.min(12, Math.abs(val) * 9);
    return a < 0.5
      ? "none"
      : `drop-shadow(${a}px 0 0 rgba(255,40,95,0.55)) drop-shadow(${-a}px 0 0 rgba(50,255,215,0.5))`;
  });

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [9, -9]), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(mx, [0, 1], [-11, 11]), { stiffness: 140, damping: 16 });
  const sheenX = useTransform(mx, [0, 1], ["0%", "100%"]);

  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
    setHover(false);
  };

  return (
    <motion.div
      style={{ filter: aberration, rotate: jitter.rotate, x: jitter.x, y: jitter.y }}
      animate={{ scale: focused ? 1 : 0.9, opacity: focused ? 1 : 0.62 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`shrink-0 [perspective:1400px] ${className}`}
    >
      <motion.button
        type="button"
        data-cursor={project.live ? "Visit site ↗" : "Inspect"}
        onPointerMove={onMove}
        onPointerEnter={() => {
          setHover(true);
          audio.play("hover");
        }}
        onPointerLeave={onLeave}
        onClick={() => {
          audio.play("flip");
          if (project.live) window.open(project.live, "_blank", "noopener");
          else inspect.open(project);
        }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.6, delay: index * 0.06 + jitter.delay }}
        style={{
          rotateX: hover ? rx : 0,
          rotateY: hover ? ry : 0,
          transformStyle: "preserve-3d",
          boxShadow:
            hover || focused
              ? "0 40px 90px -30px rgba(255,157,47,0.5), inset 0 0 0 1px rgba(255,157,47,0.4)"
              : "var(--shadow-table)",
        }}
        className="worn-edge group relative block h-full w-full overflow-hidden rounded-2xl border border-[var(--color-line-warm)] text-left transition-[border-color] duration-300"
      >
        <span className="absolute inset-0 bg-gradient-to-br from-[var(--color-felt-deep)] via-[#0a0907] to-black" />
        <span
          className="font-display pointer-events-none absolute -right-4 -top-8 select-none leading-none text-[var(--color-brass)]/[0.06] transition-transform duration-500 group-hover:scale-110"
          style={{ fontSize: "16rem", transform: "translateZ(0)" }}
        >
          {suit}
        </span>

        {/* the real website frontend (live screenshot); gradient + title show
            until it loads or if there's no live URL yet */}
        {project.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image}
            alt={project.imageAlt ?? project.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgOk(true)}
            onError={() => setImgOk(false)}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-[transform,opacity] duration-700 group-hover:scale-[1.04] ${
              imgOk ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-noir)] via-[var(--color-noir)]/35 to-transparent" />
        <span className="pointer-events-none absolute inset-2.5 rounded-xl border border-[var(--color-brass)]/25" />

        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            opacity: hover ? 0.6 : 0,
            background: useTransform(
              sheenX,
              (v) => `radial-gradient(40% 60% at ${v} 12%, rgba(255,230,180,0.55), transparent 70%)`
            ),
          }}
        />

        {/* #B — holographic foil that tilts with the cursor */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-color-dodge"
          style={{
            opacity: hover ? 0.3 : 0,
            backgroundSize: "220% 220%",
            backgroundImage: useTransform(
              [mx, my] as [typeof mx, typeof my],
              ([x, y]: number[]) =>
                `linear-gradient(${Math.round(x * 140 + y * 40)}deg, transparent 18%, rgba(255,40,150,0.5), rgba(40,220,255,0.5), rgba(150,90,255,0.5), transparent 82%)`
            ),
            backgroundPosition: useTransform(
              [mx, my] as [typeof mx, typeof my],
              ([x, y]: number[]) => `${Math.round(x * 100)}% ${Math.round(y * 100)}%`
            ),
          }}
        />

        <Tick className="left-2 top-2" />
        <Tick className="right-2 top-2 rotate-90" />
        <Tick className="bottom-2 left-2 -rotate-90" />
        <Tick className="bottom-2 right-2 rotate-180" />

        <span className="font-mono absolute left-4 top-3 z-10 flex items-center gap-2 text-xs text-[var(--color-brass)]/80">
          {String(index + 1).padStart(2, "0")}
          <span className="font-display tracking-[0.25em] text-[var(--color-neon-amber)]/90">
            · {project.role.split(" · ")[0]}
          </span>
        </span>
        <span className="font-display absolute right-4 top-3 z-10 text-xl text-[var(--color-brass)]">
          {project.rank}
          {suit}
        </span>

        <div
          className="absolute inset-x-0 bottom-0 z-10 p-5"
          style={{ transform: "translateZ(40px)" }}
        >
          <h3 className="font-display text-3xl font-bold uppercase leading-none tracking-tight transition-colors duration-300 group-hover:text-[var(--color-neon-amber)] sm:text-4xl">
            {project.title}
          </h3>
          <p className="font-script mt-1 text-lg text-[var(--color-brass-bright)]">
            {project.subtitle}
          </p>
          {showBeat && (
            <p className="mt-2 text-[11px] leading-snug text-[var(--color-muted)]">
              {story.beat}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted)]">
              {project.role}
            </p>
            <span className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--color-neon-amber)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {project.live ? "Visit ↗" : "Inspect ⤢"}
            </span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

function Tick({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-10 h-4 w-4 border-l border-t border-[var(--color-brass)]/50 transition-all duration-300 group-hover:h-6 group-hover:w-6 group-hover:border-[var(--color-neon-amber)] ${className}`}
    />
  );
}
