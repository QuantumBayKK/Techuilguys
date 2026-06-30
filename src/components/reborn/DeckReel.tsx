"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { Project, Suit } from "@/data/projects";
import { PROJECTS } from "@/data/projects";
import { audio } from "@/lib/audio";
import { handJitter } from "@/lib/seededNoise";

/**
 * Reborn — "Riffle the deck": the work, dealt as a hand of designed playing
 * cards. Each card is a self-contained, hand-finished card face (rank pips,
 * suit watermark, the brief, the stack we used) — no iframes, no screenshots,
 * no live-preview flash. Clicking any card opens its live site in a new tab.
 *
 * Desktop pins the section and riffles a 3D coverflow as you scroll; phones and
 * reduced-motion get a clean horizontal swipe strip. Both are tap-first.
 */

const N = PROJECTS.length;

/** The rail beat per card = the project's brief (what we built, told as story). */
const STORY = PROJECTS.map((p) => ({ chapter: p.title, beat: p.blurb }));

/** Suit glyph + whether it reads "red" on a real card (for the corner pips). */
const SUIT: Record<Suit, { glyph: string; red: boolean }> = {
  spades: { glyph: "♠", red: false },
  clubs: { glyph: "♣", red: false },
  hearts: { glyph: "♥", red: true },
  diamonds: { glyph: "♦", red: true },
};

const domainOf = (url?: string) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
};

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

/** Desktop: pinned; scrolling riffles a 3D coverflow of the designed cards. */
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
      const cardH = Math.min(vh * 0.72, 660);
      const cardW = Math.round(cardH * 0.7);
      const gap = Math.max(28, Math.round(vw * 0.045));
      setDim({ vw, cardW, cardH, gap, slot: cardW + gap, offset: (vw - cardW) / 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // riffle to a specific card by scrolling the pinned range to its fraction
  const goTo = useCallback((k: number) => {
    const el = ref.current;
    if (!el) return;
    const target = Math.max(0, Math.min(N - 1, k));
    const rect = el.getBoundingClientRect();
    const docTop = rect.top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: docTop + (target / (N - 1)) * range, behavior: "smooth" });
    audio.play("flip");
  }, []);

  return (
    <section id="rb-riffle" ref={ref} className="relative" style={{ height: `${N * 90 + 30}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* living felt grain breathing under the table */}
        <div className="felt-grain pointer-events-none absolute inset-0 -z-10" aria-hidden />
        <Heading active={active} />

        <div className="relative flex flex-1 items-center overflow-hidden">
          <motion.div
            style={{ x: xs, gap: dim.gap, perspective: 1600 }}
            className="relative flex w-max items-center [transform-style:preserve-3d]"
          >
            {PROJECTS.map((p, i) => (
              <ReelCard
                key={p.id}
                project={p}
                index={i}
                activeFloat={activeFloat}
                focused={i === active}
                onSelect={() => (i === active ? null : goTo(i))}
                dim={dim}
              />
            ))}
          </motion.div>

          <DeckArrow dir="prev" disabled={active === 0} onClick={() => goTo(active - 1)} />
          <DeckArrow dir="next" disabled={active === N - 1} onClick={() => goTo(active + 1)} />
        </div>

        <StoryRail active={active} onJump={goTo} />
      </div>
    </section>
  );
}

function DeckArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous card" : "Next card"}
      onClick={onClick}
      disabled={disabled}
      data-magnetic
      className={`group absolute top-1/2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-brass)]/30 bg-black/45 text-[var(--color-brass-bright)] backdrop-blur transition-all duration-300 hover:border-[var(--color-neon-amber)] hover:text-[var(--color-neon-amber)] disabled:pointer-events-none disabled:opacity-0 ${
        dir === "prev" ? "left-4 sm:left-8" : "right-4 sm:right-8"
      }`}
    >
      <span className="text-xl leading-none transition-transform duration-300 group-hover:scale-125">
        {dir === "prev" ? "‹" : "›"}
      </span>
    </button>
  );
}

/** The story rail: clickable nodes that light up + the active beat. */
function StoryRail({ active, onJump }: { active: number; onJump: (k: number) => void }) {
  const s = STORY[active] ?? STORY[0];
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-[5vh]">
      <div className="mb-3 flex items-center justify-center gap-2">
        {STORY.map((st, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Riffle to ${st.chapter}`}
            onClick={() => onJump(i)}
            className="group flex h-5 items-center"
          >
            <motion.span
              animate={{
                width: i === active ? 26 : 8,
                backgroundColor:
                  i <= active ? "var(--color-neon-amber)" : "var(--color-line-warm)",
              }}
              className="block h-1 rounded-full transition-opacity group-hover:opacity-80"
            />
          </button>
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

/** Mobile / reduced-motion: native swipe strip of the same designed cards. */
function Strip() {
  return (
    <section id="rb-riffle" className="relative py-16 sm:py-20">
      <Heading active={0} />
      <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] sm:gap-6 sm:px-10">
        {PROJECTS.map((p, i) => (
          <ReelCard
            key={p.id}
            project={p}
            index={i}
            focused
            showBeat
            className="aspect-[3/4.35] w-[80vw] max-w-[340px] shrink-0 snap-center sm:w-[46vw]"
          />
        ))}
      </div>
      <p className="mt-4 px-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-faint)] sm:px-10">
        swipe · tap a card to open it live
      </p>
    </section>
  );
}

function ReelCard({
  project,
  index,
  activeFloat,
  focused = true,
  showBeat = false,
  onSelect,
  dim,
  className = "",
}: {
  project: Project;
  index: number;
  activeFloat?: MotionValue<number>;
  focused?: boolean;
  showBeat?: boolean;
  onSelect?: () => void;
  dim?: Dim;
  className?: string;
}) {
  const suit = SUIT[project.suit] ?? SUIT.spades;
  const story = STORY[index] ?? STORY[0];
  // hand-dealt jitter: a stable, tiny off-square
  const jitter = handJitter(`reel-${project.id}`);

  // ── coverflow: signed distance from centre drives 3D fan + depth + light ──
  const fallback = useMotionValue(0);
  const af = activeFloat ?? fallback;
  const rel = useTransform(af, (a) => a - index); // >0 ⇒ card is left of centre
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const rotateY = useSpring(
    useTransform(rel, (r) => clamp(r, -2, 2) * 17),
    { stiffness: 120, damping: 20 }
  );
  const z = useSpring(
    useTransform(rel, (r) => -Math.min(Math.abs(r), 3) * 90),
    { stiffness: 120, damping: 20 }
  );
  const scale = useTransform(rel, (r) => 1 - Math.min(Math.abs(r), 2) * 0.13);
  const opacity = useTransform(rel, (r) => 1 - Math.min(Math.abs(r), 2.4) * 0.32);
  const brightness = useTransform(rel, (r) => 1 - Math.min(Math.abs(r), 2) * 0.24);
  const filter = useMotionTemplate`brightness(${brightness})`;
  // keep the centred card on top so its click can never be eaten by a neighbour
  const zIndex = useTransform(rel, (r) => Math.round(60 - Math.min(Math.abs(r), 6) * 8));

  // cursor tilt on hover (desktop only — pointer-fine)
  const [hover, setHover] = useState(false);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 140, damping: 16 });
  const ryHover = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 140, damping: 16 });

  // ── chromatic aberration: RGB split that tracks the cursor ──
  const caX = useSpring(useTransform(mx, [0, 1], [-5, 5]), { stiffness: 200, damping: 22 });
  const caY = useSpring(useTransform(my, [0, 1], [-5, 5]), { stiffness: 200, damping: 22 });
  const caXn = useTransform(caX, (v) => -v);
  const caYn = useTransform(caY, (v) => -v);
  // a glare sheen that follows the pointer across the card
  const gxPct = useTransform(mx, (v) => v * 100);
  const gyPct = useTransform(my, (v) => v * 100);
  const glare = useMotionTemplate`radial-gradient(440px 440px at ${gxPct}% ${gyPct}%, rgba(255,228,176,0.16), transparent 60%)`;
  // chromatic edge — a red/cyan split riding the inner frame
  const edge = useMotionTemplate`inset ${caX}px ${caY}px 0 rgba(255,42,110,0.40), inset ${caXn}px ${caYn}px 0 rgba(26,216,255,0.36)`;

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
    setHover(false);
  };

  // off-centre cards riffle to centre; the centre card (and every strip card)
  // opens its live site in a new tab. window.open is explicit so the click is
  // bulletproof regardless of stacking / gesture quirks.
  const isLink = focused && !!project.live;
  const handleClick = (e: React.MouseEvent) => {
    if (!focused) {
      e.preventDefault();
      onSelect?.();
      return;
    }
    if (!project.live) return;
    e.preventDefault();
    audio.play("flip");
    window.open(project.live, "_blank", "noopener,noreferrer");
  };

  const sizeStyle = dim ? { width: dim.cardW, height: dim.cardH } : undefined;

  const Pip = ({ corner }: { corner: "tl" | "br" }) => (
    <span
      className={`pointer-events-none absolute z-20 flex flex-col items-center leading-none ${
        corner === "tl" ? "left-3.5 top-3" : "bottom-3 right-3.5"
      } ${suit.red ? "text-[#e7728a]" : "text-[var(--color-brass-bright)]"}`}
      style={{ transform: corner === "br" ? "rotate(180deg)" : undefined }}
    >
      <span className="font-display text-[1.4rem] font-bold">{project.rank}</span>
      <span className="text-[1.05rem]">{suit.glyph}</span>
    </span>
  );

  // the title, drawn three times for a true RGB-split chromatic fringe
  const Title = () => (
    <h3 className="font-display relative text-[clamp(1.7rem,4.5vw,2.6rem)] font-bold uppercase leading-[0.92] tracking-tight">
      <motion.span
        aria-hidden
        style={{ x: caX, y: caY }}
        className={`absolute inset-0 select-none text-[#ff2d6e] mix-blend-screen transition-opacity duration-300 ${
          hover ? "opacity-80" : "opacity-0"
        }`}
      >
        {project.title}
      </motion.span>
      <motion.span
        aria-hidden
        style={{ x: caXn, y: caYn }}
        className={`absolute inset-0 select-none text-[#1ad8ff] mix-blend-screen transition-opacity duration-300 ${
          hover ? "opacity-80" : "opacity-0"
        }`}
      >
        {project.title}
      </motion.span>
      <span
        className="relative block transition-colors duration-300 group-hover:text-[var(--color-neon-amber)]"
        style={{ textShadow: "0.6px 0 rgba(255,40,110,0.38), -0.6px 0 rgba(26,216,255,0.32)" }}
      >
        {project.title}
      </span>
    </h3>
  );

  return (
    <motion.div
      style={{
        rotate: jitter.rotate,
        rotateY: activeFloat ? rotateY : undefined,
        z: activeFloat ? z : undefined,
        scale: activeFloat ? scale : undefined,
        opacity: activeFloat ? opacity : undefined,
        filter: activeFloat ? filter : undefined,
        zIndex: activeFloat ? zIndex : undefined,
        transformStyle: "preserve-3d",
        ...sizeStyle,
      }}
      className={`relative shrink-0 [perspective:1400px] ${className}`}
    >
      <motion.a
        href={isLink ? project.live : undefined}
        target={isLink ? "_blank" : undefined}
        rel={isLink ? "noopener noreferrer" : undefined}
        aria-label={
          isLink ? `Open ${project.title} live site` : `Bring ${project.title} to the front`
        }
        data-cursor={isLink ? "Open ↗" : undefined}
        data-magnetic={isLink ? true : undefined}
        onClick={handleClick}
        onPointerMove={onMove}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          setHover(true);
          audio.play("hover");
        }}
        onPointerLeave={onLeave}
        whileTap={{ scale: 0.985 }}
        style={{
          rotateX: hover ? rx : 0,
          rotateY: hover ? ryHover : 0,
          transformStyle: "preserve-3d",
          boxShadow:
            hover || focused
              ? "0 50px 110px -34px rgba(255,157,47,0.55), inset 0 0 0 1px rgba(255,157,47,0.38)"
              : "var(--shadow-table)",
        }}
        className="worn-edge group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--color-line-warm)] text-left transition-[border-color] duration-300 hover:border-[var(--color-neon-amber)]/60"
      >
        {/* felt face + warm vignette */}
        <span className="absolute inset-0 bg-gradient-to-br from-[var(--color-felt-deep)] via-[#0c0a07] to-black" />
        <span
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, rgba(255,180,90,0.10), transparent 55%)",
          }}
        />

        {/* glare sheen that tracks the cursor */}
        <motion.span
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-[5] transition-opacity duration-300 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: glare }}
        />

        {/* giant suit watermark */}
        <span
          className={`font-display pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 select-none leading-none transition-transform duration-500 group-hover:scale-110 ${
            suit.red ? "text-[#e7728a]/[0.06]" : "text-[var(--color-brass)]/[0.07]"
          }`}
          style={{ fontSize: "17rem", transform: "translateZ(0)" }}
        >
          {suit.glyph}
        </span>

        {/* corner rank pips — real playing-card framing */}
        <Pip corner="tl" />
        <Pip corner="br" />

        {/* inner brass frame + chromatic edge split */}
        <span className="pointer-events-none absolute inset-2.5 z-10 rounded-xl border border-[var(--color-brass)]/25" />
        <motion.span
          aria-hidden
          className={`pointer-events-none absolute inset-2.5 z-10 rounded-xl transition-opacity duration-300 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
          style={{ boxShadow: edge }}
        />
        <Tick className="left-2 top-2" />
        <Tick className="right-2 top-2 rotate-90" />
        <Tick className="bottom-2 left-2 -rotate-90" />
        <Tick className="bottom-2 right-2 rotate-180" />

        {/* ── content ── */}
        <div
          className="relative z-20 flex h-full flex-col px-6 pb-6 pt-14 sm:px-7"
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="font-mono mb-2 flex items-center gap-2 text-[11px] tracking-wide text-[var(--color-brass)]/80">
            {String(index + 1).padStart(2, "0")}
            <span className="font-display tracking-[0.22em] text-[var(--color-neon-amber)]/90">
              · {project.role.split(" · ")[0]}
            </span>
          </span>

          <Title />
          <p className="font-body mt-1.5 text-sm font-medium tracking-wide text-[var(--color-brass-bright)]">
            {project.subtitle}
          </p>

          <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-ink)]/80">
            {showBeat ? story.beat : project.blurb}
          </p>

          {/* the stack we used */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.skills
              .flatMap((g) => g.items)
              .slice(0, 4)
              .map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[var(--color-line-warm)] bg-[var(--color-neon-amber)]/[0.04] px-2.5 py-0.5 text-[10px] tracking-wide text-[var(--color-ink)]/75"
                >
                  {s}
                </span>
              ))}
          </div>

          {/* footer plate — outcome + the open-live call */}
          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div className="min-w-0">
              <p className="font-display text-[9px] uppercase tracking-[0.3em] text-[var(--color-brass)]/70">
                Outcome
              </p>
              <p className="mt-0.5 truncate text-[12px] text-[var(--color-muted)]">
                {project.outcomes}
              </p>
            </div>
            {project.live && (
              <span className="shrink-0 font-mono text-[10px] text-[var(--color-brass-bright)]/70">
                {domainOf(project.live)}
              </span>
            )}
          </div>

          {project.live && (
            <span
              className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2 font-display text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
                focused
                  ? "border-[var(--color-neon-amber)]/60 bg-[var(--color-neon-amber)]/10 text-[var(--color-neon-amber)] group-hover:bg-[var(--color-neon-amber)]/20"
                  : "border-[var(--color-brass)]/40 text-[var(--color-brass-bright)]"
              }`}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-neon-amber)]" />
              {focused ? "Open the live site ↗" : "Bring to front"}
            </span>
          )}
        </div>
      </motion.a>
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
