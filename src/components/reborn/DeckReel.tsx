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
  type MotionValue,
} from "framer-motion";
import type { Project } from "@/data/projects";
import { PROJECTS } from "@/data/projects";
import { dealerById } from "@/data/dealers";
import { audio } from "@/lib/audio";
import { handJitter } from "@/lib/seededNoise";

/**
 * Reborn — "Riffle the deck", told as a hand being played one card at a time.
 * The deck is pinned; as you scroll, each card slides to centre stage and its
 * REAL live site magic-reveals — a slow curtain-rise (clip + un-blur) with a
 * light sweeping down it. Embeddable sites render as a live <iframe>; the two
 * that forbid framing fall back to a live screenshot. The story rail under the
 * deck narrates the beat for whichever card is centred.
 * Phones / reduced-motion get a native swipe strip (screenshots only).
 */

const N = PROJECTS.length;
const IFRAME_W = 1280; // reference desktop width the live site renders at

/** The rail beat per card = the project's brief (what we built, told as story). */
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
    <div className="mx-auto flex w-full max-w-6xl items-end justify-between px-6 pt-[6vh] sm:px-10">
      <h2 className="misprint font-display text-[clamp(1.8rem,5.5vw,4.5rem)] font-bold uppercase leading-none tracking-tight">
        Riffle&nbsp;the&nbsp;deck
      </h2>
      <div className="hidden text-right sm:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-faint)]">
          Card {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
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

type Dim = { vw: number; cardW: number; cardH: number; gap: number; slot: number; offset: number };

/** Desktop: pinned; scroll centres each card and reveals its live site. */
function Pinned() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [dim, setDim] = useState<Dim>({ vw: 0, cardW: 0, cardH: 0, gap: 0, slot: 0, offset: 0 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // continuous card position 0..N-1; the centred card is round(activeFloat)
  const activeFloat = useTransform(scrollYProgress, [0, 1], [0, N - 1]);
  // translate the rail so the active card sits dead centre
  const x = useTransform(activeFloat, (a) => dim.offset - a * dim.slot);
  const xs = useSpring(x, { stiffness: 90, damping: 22, mass: 0.6 });

  useMotionValueEvent(activeFloat, "change", (v) => {
    const idx = Math.max(0, Math.min(N - 1, Math.round(v)));
    setActive((cur) => {
      if (cur === idx) return cur;
      audio.play("deal"); // soft card-slide as the next card takes the table
      return idx;
    });
  });

  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cardH = Math.min(vh * 0.66, 640);
      const cardW = Math.round(cardH * 0.72); // ~3/4 portrait
      const gap = Math.max(28, Math.round(vw * 0.045));
      setDim({ vw, cardW, cardH, gap, slot: cardW + gap, offset: (vw - cardW) / 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section id="rb-riffle" ref={ref} className="relative" style={{ height: `${N * 95 + 30}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* #4 — living felt grain breathing under the table */}
        <div className="felt-grain pointer-events-none absolute inset-0 -z-10" aria-hidden />
        <Heading active={active} />

        <div className="flex flex-1 items-center overflow-hidden">
          <motion.div style={{ x: xs, gap: dim.gap }} className="relative flex w-max items-center">
            {PROJECTS.map((p, i) => (
              <ReelCard
                key={p.id}
                project={p}
                index={i}
                activeFloat={activeFloat}
                focused={i === active}
                dim={dim}
                allowEmbed
              />
            ))}
          </motion.div>
        </div>

        <StoryRail active={active} />
      </div>
    </section>
  );
}

/** The story rail: nodes that light up + the active beat (the storytelling). */
function StoryRail({ active }: { active: number }) {
  const s = STORY[active] ?? STORY[0];
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-[5vh]">
      <div className="mb-3 flex items-center justify-center gap-2">
        {STORY.map((_, i) => (
          <motion.span
            key={i}
            animate={{
              width: i === active ? 26 : 8,
              backgroundColor:
                i <= active ? "var(--color-neon-amber)" : "var(--color-line-warm)",
            }}
            className="block h-1 rounded-full"
          />
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

/** Mobile / reduced-motion: native swipe strip, live screenshots, beat per card. */
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
            className="aspect-[3/4] w-[74vw] shrink-0 sm:w-[44vw]"
          />
        ))}
      </div>
    </section>
  );
}

function ReelCard({
  project,
  index,
  activeFloat,
  focused = true,
  showBeat = false,
  dim,
  allowEmbed = false,
  className = "",
}: {
  project: Project;
  index: number;
  activeFloat?: MotionValue<number>;
  focused?: boolean;
  showBeat?: boolean;
  dim?: Dim;
  allowEmbed?: boolean;
  className?: string;
}) {
  const suit = dealerById(project.dealer).suit;
  const story = STORY[index] ?? STORY[0];
  // #1/#2 — hand-dealt jitter: a stable, tiny off-square
  const jitter = handJitter(`reel-${project.id}`);

  // distance from centre → scale + dim of neighbouring cards (pinned only)
  const fallback = useMotionValue(0);
  const af = activeFloat ?? fallback;
  const scale = useTransform(af, (a) => 1 - Math.min(Math.abs(a - index), 1.3) * 0.16);
  const dim2 = useTransform(af, (a) => 1 - Math.min(Math.abs(a - index), 1) * 0.5);

  // cursor tilt on hover
  const [hover, setHover] = useState(false);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(mx, [0, 1], [-10, 10]), { stiffness: 140, damping: 16 });

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

  const sizeStyle = dim ? { width: dim.cardW, height: dim.cardH } : undefined;

  return (
    <motion.div
      style={{
        rotate: jitter.rotate,
        scale: activeFloat ? scale : undefined,
        opacity: activeFloat ? dim2 : undefined,
        ...sizeStyle,
      }}
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
        }}
        style={{
          rotateX: hover ? rx : 0,
          rotateY: hover ? ry : 0,
          transformStyle: "preserve-3d",
          boxShadow:
            hover || focused
              ? "0 50px 110px -34px rgba(255,157,47,0.55), inset 0 0 0 1px rgba(255,157,47,0.4)"
              : "var(--shadow-table)",
        }}
        className="worn-edge group relative block h-full w-full overflow-hidden rounded-2xl border border-[var(--color-line-warm)] text-left transition-[border-color] duration-300"
      >
        {/* base: the card's identity (felt + suit), shown before the reveal */}
        <span className="absolute inset-0 bg-gradient-to-br from-[var(--color-felt-deep)] via-[#0a0907] to-black" />
        <span
          className="font-display pointer-events-none absolute -right-4 -top-8 select-none leading-none text-[var(--color-brass)]/[0.07] transition-transform duration-500 group-hover:scale-110"
          style={{ fontSize: "16rem", transform: "translateZ(0)" }}
        >
          {suit}
        </span>

        {/* the slow magic reveal of the REAL live site */}
        <CardPreview project={project} focused={focused} allowEmbed={allowEmbed} dim={dim} />

        {/* readability scrim + inner frame, above the preview */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-noir)] via-[var(--color-noir)]/30 to-transparent" />
        <span className="pointer-events-none absolute inset-2.5 rounded-xl border border-[var(--color-brass)]/25" />

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

        <div className="absolute inset-x-0 bottom-0 z-10 p-5" style={{ transform: "translateZ(40px)" }}>
          <h3 className="font-display text-3xl font-bold uppercase leading-none tracking-tight transition-colors duration-300 group-hover:text-[var(--color-neon-amber)] sm:text-4xl">
            {project.title}
          </h3>
          <p className="font-script mt-1 text-lg text-[var(--color-brass-bright)]">
            {project.subtitle}
          </p>
          {showBeat && (
            <p className="mt-2 text-[11px] leading-snug text-[var(--color-muted)]">{story.beat}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted)]">
              {project.role}
            </p>
            <span className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--color-neon-amber)] opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
              {project.live ? "Visit ↗" : "Inspect ⤢"}
            </span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

/**
 * The live preview + magic reveal. Curtain-rises (clip-path) and un-blurs when
 * the card is centred; a light bar sweeps down it. Embeddable sites mount a
 * real <iframe> (lazily, only once focused) over a screenshot poster; the two
 * that block framing show the live screenshot alone.
 */
function CardPreview({
  project,
  focused,
  allowEmbed,
  dim,
}: {
  project: Project;
  focused: boolean;
  allowEmbed: boolean;
  dim?: Dim;
}) {
  const [live, setLive] = useState(false); // lazy-mount the iframe once focused
  const [frameOk, setFrameOk] = useState(false);

  useEffect(() => {
    if (focused) setLive(true);
  }, [focused]);

  const canEmbed = allowEmbed && project.embed && !!project.live && !!dim;
  const fScale = dim && dim.cardW ? dim.cardW / IFRAME_W : 0.3;
  const iframeH = dim ? Math.ceil(dim.cardH / fScale) : Math.ceil(IFRAME_W * 1.4);

  return (
    <motion.div
      initial={false}
      animate={focused ? "on" : "off"}
      variants={{
        off: { clipPath: "inset(0% 0% 100% 0%)", filter: "blur(16px)", scale: 1.04 },
        on: { clipPath: "inset(0% 0% 0% 0%)", filter: "blur(0px)", scale: 1 },
      }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 overflow-hidden"
    >
      {/* live screenshot — instant poster + the fallback for framing-blocked sites */}
      {project.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.image}
          alt={project.imageAlt ?? project.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      )}

      {/* the REAL running site, scaled to fit the card; pointer-events off so the
          pinned scroll keeps working — clicking the card opens the live site */}
      {canEmbed && live && (
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <iframe
            src={project.live}
            title={`${project.title} — live`}
            loading="lazy"
            tabIndex={-1}
            scrolling="no"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            onLoad={() => setFrameOk(true)}
            style={{
              width: IFRAME_W,
              height: iframeH,
              transform: `scale(${fScale})`,
              transformOrigin: "top left",
              border: 0,
              pointerEvents: "none",
              opacity: frameOk ? 1 : 0,
              transition: "opacity 600ms ease",
            }}
          />
          {/* tiny "live" tell so it reads as the running site, not an image */}
          <span className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-neon-amber)] backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-neon-amber)]" />
            live
          </span>
        </div>
      )}

      {/* the sweep of light that rides the curtain up */}
      {focused && (
        <motion.span
          key={project.id}
          aria-hidden
          initial={{ y: "-110%" }}
          animate={{ y: "120%" }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(255,224,170,0.35), transparent)",
          }}
        />
      )}
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
