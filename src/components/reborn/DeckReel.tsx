"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { Project, Suit } from "@/data/projects";
import { PROJECTS } from "@/data/projects";
import ScrambleText from "@/components/framer/ScrambleText";
import { audio } from "@/lib/audio";
import { handJitter } from "@/lib/seededNoise";

/**
 * Reborn — "Riffle the deck": the work, dealt as a hand of designed playing
 * cards. Each card is a self-contained, hand-finished face (rank pips, suit
 * watermark, the brief, the stack we used).
 *
 * ONE layout for every device: a smooth NATIVE horizontal snap-rail. No scroll
 * pinning (which fought the page's smooth-scroll and made the coverflow janky),
 * no "focused-only" clickability, no delayed window.open. Every card is a plain
 * <a target="_blank"> so clicking ALWAYS opens the live site in the click
 * gesture — reliable, never popup-blocked. Arrows + story dots riffle the rail.
 */

const N = PROJECTS.length;

/** The rail beat per card = the project's brief (what we built, told as story). */
const STORY = PROJECTS.map((p) => ({ chapter: p.title, beat: p.blurb }));

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  // Track the card nearest the rail's centre from real scroll position — no
  // springs, no Math.round flip-flop, so it never flickers between two cards.
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      const cards = sc.querySelectorAll<HTMLElement>("[data-card]");
      if (!cards.length) return;
      const centre = sc.scrollLeft + sc.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((c, i) => {
        const cc = c.offsetLeft + c.clientWidth / 2;
        const d = Math.abs(cc - centre);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      if (best !== activeRef.current) {
        activeRef.current = best;
        setActive(best);
        audio.play("deal");
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    compute();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToCard = useCallback((k: number) => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const target = Math.max(0, Math.min(N - 1, k));
    const card = sc.querySelectorAll<HTMLElement>("[data-card]")[target];
    if (!card) return;
    const left = card.offsetLeft - (sc.clientWidth - card.clientWidth) / 2;
    sc.scrollTo({ left, behavior: "smooth" });
    audio.play("flip");
  }, []);

  return (
    <section id="rb-riffle" className="relative py-[10vh] sm:py-[13vh]">
      {/* living felt grain breathing under the table */}
      <div className="felt-grain pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <Heading active={active} />

      <div className="relative mt-6 sm:mt-8">
        <div
          ref={scrollerRef}
          className="relative flex snap-x snap-mandatory items-center gap-5 overflow-x-auto overflow-y-hidden pb-6 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-8 [&::-webkit-scrollbar]:hidden"
        >
          {/* leading spacer so the first card can rest dead-centre */}
          <div aria-hidden className="shrink-0 basis-[max(1.5rem,calc(50%-min(210px,23vw)))]" />
          {PROJECTS.map((p, i) => (
            <ReelCard key={p.id} project={p} index={i} />
          ))}
          {/* trailing spacer so the last card can rest dead-centre */}
          <div aria-hidden className="shrink-0 basis-[max(1.5rem,calc(50%-min(210px,23vw)))]" />
        </div>

        <DeckArrow dir="prev" disabled={active === 0} onClick={() => scrollToCard(active - 1)} />
        <DeckArrow dir="next" disabled={active === N - 1} onClick={() => scrollToCard(active + 1)} />
      </div>

      <StoryRail active={active} onJump={scrollToCard} />

      <p className="mt-2 px-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-faint)]">
        swipe / arrows to riffle · click a card to open it live ↗
      </p>
    </section>
  );
}

function Heading({ active }: { active: number }) {
  const s = STORY[active] ?? STORY[0];
  return (
    <div className="mx-auto flex w-full max-w-6xl items-end justify-between px-6 sm:px-10">
      <h2 className="misprint font-display text-[clamp(1.8rem,5.5vw,4.5rem)] font-bold uppercase leading-none tracking-tight">
        <ScrambleText text={"Riffle the deck"} />
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
      className={`group absolute top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-brass)]/30 bg-black/50 text-[var(--color-brass-bright)] backdrop-blur transition-all duration-300 hover:border-[var(--color-neon-amber)] hover:text-[var(--color-neon-amber)] disabled:pointer-events-none disabled:opacity-0 sm:grid ${
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
    <div className="mx-auto w-full max-w-3xl px-6 pt-2">
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

function ReelCard({ project, index }: { project: Project; index: number }) {
  const suit = SUIT[project.suit] ?? SUIT.spades;
  // hand-dealt jitter: a stable, tiny off-square
  const jitter = handJitter(`reel-${project.id}`);
  const [hover, setHover] = useState(false);

  // cursor tilt + glare on hover (desktop / fine-pointer only)
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 140, damping: 16 });
  const caX = useSpring(useTransform(mx, [0, 1], [-5, 5]), { stiffness: 200, damping: 22 });
  const caY = useSpring(useTransform(my, [0, 1], [-5, 5]), { stiffness: 200, damping: 22 });
  const caXn = useTransform(caX, (v) => -v);
  const caYn = useTransform(caY, (v) => -v);
  const gxPct = useTransform(mx, (v) => v * 100);
  const gyPct = useTransform(my, (v) => v * 100);
  const glare = useMotionTemplate`radial-gradient(440px 440px at ${gxPct}% ${gyPct}%, rgba(255,228,176,0.16), transparent 60%)`;
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
      data-card
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      style={{ rotate: jitter.rotate }}
      className="relative aspect-[3/4.25] w-[86vw] max-w-[420px] shrink-0 snap-center [perspective:1400px] sm:w-[min(420px,46vw)]"
    >
      {/* a warm pool the card sits in */}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-[54%] -z-10 h-[122%] w-[140%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${
          hover ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(50% 44% at 50% 50%, rgba(255,182,82,0.26), rgba(255,146,44,0.08) 46%, transparent 70%)",
          filter: "blur(10px)",
        }}
      />

      <motion.a
        href={project.live}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${project.title} live site in a new tab`}
        data-cursor="Open ↗"
        onClick={() => audio.play("flip")}
        onPointerMove={onMove}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          setHover(true);
          audio.play("hover");
        }}
        onPointerLeave={onLeave}
        // firm press into the felt on click; releasing opens the live site
        whileTap={{ scale: 0.93 }}
        style={{
          rotateX: hover ? rx : 0,
          rotateY: hover ? ry : 0,
          transformStyle: "preserve-3d",
          transformOrigin: "50% 85%",
          boxShadow: hover
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

        {/* corner rank pips */}
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
            {project.blurb}
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

          {/* footer plate — outcome + domain */}
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
            <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--color-neon-amber)] bg-[var(--color-neon-amber)] px-5 py-3.5 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--color-noir)] shadow-[0_14px_36px_-12px_rgba(255,157,47,0.7)] transition-all duration-300 group-hover:brightness-105">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-noir)]" />
              Open the live site ↗
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
