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
import type { Project } from "@/data/projects";
import { PROJECTS } from "@/data/projects";
import { dealerById } from "@/data/dealers";
import { audio } from "@/lib/audio";
import { handJitter } from "@/lib/seededNoise";

/**
 * Reborn — "Riffle the deck", told as a hand played one card at a time.
 *
 * The deck is pinned; scrolling riffles a 3D coverflow — the centred card sits
 * dead-on while its neighbours fan back in depth (rotateY + translateZ). Each
 * card is a little browser window (traffic lights + live address bar) that
 * magic-reveals the REAL site: embeddable ones mount a live <iframe> you can
 * actually click into ("Interact"); the two that forbid framing show a live
 * screenshot. You can riffle with the on-screen arrows or by clicking the story
 * dots, and every card opens its live site in a new tab.
 *
 * Phones / reduced-motion get a native swipe strip (screenshots only).
 */

const N = PROJECTS.length;
const IFRAME_W = 1280; // reference desktop width the live site renders at

/** The rail beat per card = the project's brief (what we built, told as story). */
const STORY = PROJECTS.map((p) => ({ chapter: p.title, beat: p.blurb }));

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

/** Desktop: pinned; scroll riffles a coverflow and reveals the centred site. */
function Pinned() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [interacting, setInteracting] = useState(false);
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

  // leaving a card always drops you out of inline-interact mode
  useEffect(() => {
    setInteracting(false);
  }, [active]);

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
    <section id="rb-riffle" ref={ref} className="relative" style={{ height: `${N * 95 + 30}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* #4 — living felt grain breathing under the table */}
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
                interacting={interacting && i === active}
                onInteract={() => setInteracting(true)}
                onExit={() => setInteracting(false)}
                dim={dim}
                allowEmbed
              />
            ))}
          </motion.div>

          {/* riffle arrows — fade out while you're inside a live site */}
          <DeckArrow
            dir="prev"
            disabled={active === 0}
            hidden={interacting}
            onClick={() => goTo(active - 1)}
          />
          <DeckArrow
            dir="next"
            disabled={active === N - 1}
            hidden={interacting}
            onClick={() => goTo(active + 1)}
          />
        </div>

        <StoryRail active={active} onJump={goTo} />
      </div>
    </section>
  );
}

function DeckArrow({
  dir,
  disabled,
  hidden,
  onClick,
}: {
  dir: "prev" | "next";
  disabled?: boolean;
  hidden?: boolean;
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
      } ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
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
            className="aspect-[3/4] w-[78vw] shrink-0 sm:w-[46vw]"
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
  interacting = false,
  onInteract,
  onExit,
  showBeat = false,
  dim,
  allowEmbed = false,
  className = "",
}: {
  project: Project;
  index: number;
  activeFloat?: MotionValue<number>;
  focused?: boolean;
  interacting?: boolean;
  onInteract?: () => void;
  onExit?: () => void;
  showBeat?: boolean;
  dim?: Dim;
  allowEmbed?: boolean;
  className?: string;
}) {
  const suit = dealerById(project.dealer).suit;
  const story = STORY[index] ?? STORY[0];
  // #1/#2 — hand-dealt jitter: a stable, tiny off-square
  const jitter = handJitter(`reel-${project.id}`);

  const canEmbed = allowEmbed && !!project.embed && !!project.live && !!dim;

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
  const opacity = useTransform(rel, (r) => 1 - Math.min(Math.abs(r), 2.4) * 0.4);
  const brightness = useTransform(rel, (r) => 1 - Math.min(Math.abs(r), 2) * 0.34);
  const filter = useMotionTemplate`brightness(${brightness})`;

  // cursor tilt on hover (suspended while you're interacting with the live site)
  const [hover, setHover] = useState(false);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 140, damping: 16 });
  const ryHover = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 140, damping: 16 });

  const onMove = (e: React.PointerEvent) => {
    if (interacting) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
    setHover(false);
  };

  const openLive = () => {
    if (!project.live) return;
    audio.play("flip");
    window.open(project.live, "_blank", "noopener");
  };

  const sizeStyle = dim ? { width: dim.cardW, height: dim.cardH } : undefined;
  const lifted = hover || interacting;

  return (
    <motion.div
      style={{
        rotate: jitter.rotate,
        rotateY: activeFloat ? rotateY : undefined,
        z: activeFloat ? z : undefined,
        scale: activeFloat ? scale : undefined,
        opacity: activeFloat ? opacity : undefined,
        filter: activeFloat ? filter : undefined,
        transformStyle: "preserve-3d",
        ...sizeStyle,
      }}
      className={`shrink-0 [perspective:1400px] ${className}`}
    >
      <motion.div
        onPointerMove={onMove}
        onPointerEnter={() => {
          if (interacting) return;
          setHover(true);
          audio.play("hover");
        }}
        onPointerLeave={onLeave}
        style={{
          rotateX: hover && !interacting ? rx : 0,
          rotateY: hover && !interacting ? ryHover : 0,
          transformStyle: "preserve-3d",
          boxShadow: lifted || focused
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

        {/* a little browser window around the live preview */}
        <BrowserPreview
          project={project}
          focused={focused}
          interacting={interacting}
          canEmbed={canEmbed}
          dim={dim}
        />

        {/* readability scrim — only at the very bottom so the live site stays
            bright; lifts away while you're interacting with the real site */}
        <span
          className={`pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-noir)_0%,rgba(0,0,0,0.55)_18%,rgba(0,0,0,0)_42%)] transition-opacity duration-300 ${
            interacting ? "opacity-0" : "opacity-100"
          }`}
        />
        <span className="pointer-events-none absolute inset-2.5 z-10 rounded-xl border border-[var(--color-brass)]/25" />

        <Tick className="left-2 top-2" />
        <Tick className="right-2 top-2 rotate-90" />
        <Tick className="bottom-2 left-2 -rotate-90" />
        <Tick className="bottom-2 right-2 rotate-180" />

        {/* card rank corner (over the chrome, top-right) */}
        <span className="font-display absolute right-3 top-2.5 z-20 text-xl text-[var(--color-brass)] mix-blend-screen">
          {project.rank}
          {suit}
        </span>

        {/* ── bottom plate: title + the actions (hidden while interacting) ── */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 p-5 transition-opacity duration-300 ${
            interacting ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="font-mono mb-1 flex items-center gap-2 text-xs text-[var(--color-brass)]/80">
            {String(index + 1).padStart(2, "0")}
            <span className="font-display tracking-[0.25em] text-[var(--color-neon-amber)]/90">
              · {project.role.split(" · ")[0]}
            </span>
          </span>
          <h3 className="font-display text-3xl font-bold uppercase leading-none tracking-tight transition-colors duration-300 group-hover:text-[var(--color-neon-amber)] sm:text-4xl">
            {project.title}
          </h3>
          <p className="font-body mt-1.5 text-sm font-medium tracking-wide text-[var(--color-brass-bright)] sm:text-base">
            {project.subtitle}
          </p>
          {showBeat && (
            <p className="mt-2 text-[11px] leading-snug text-[var(--color-muted)]">{story.beat}</p>
          )}

          {/* actions: Interact (embeddable, live cards only) + Open live */}
          {focused && project.live ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {canEmbed && onInteract && (
                <button
                  type="button"
                  data-magnetic
                  onClick={onInteract}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-neon-amber)]/60 bg-[var(--color-neon-amber)]/10 px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.18em] text-[var(--color-neon-amber)] transition-colors hover:bg-[var(--color-neon-amber)]/20"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-neon-amber)]" />
                  Try it live
                </button>
              )}
              <button
                type="button"
                data-magnetic
                onClick={openLive}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brass)]/40 px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.18em] text-[var(--color-brass-bright)] transition-colors hover:border-[var(--color-neon-amber)] hover:text-[var(--color-neon-amber)]"
              >
                Open site ↗
              </button>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted)]">
                {project.role}
              </p>
              {project.live && (
                <span className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--color-neon-amber)] opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
                  Open ↗
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── interacting: exit chrome over the live, now-clickable site ── */}
        {interacting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute right-3 top-10 z-30 flex items-center gap-2"
          >
            <span className="rounded-full bg-black/60 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-neon-amber)] backdrop-blur">
              scroll · click inside
            </span>
            <button
              type="button"
              onClick={onExit}
              aria-label="Stop interacting"
              className="grid h-7 w-7 place-items-center rounded-full border border-[var(--color-brass)]/40 bg-black/60 text-sm text-[var(--color-brass-bright)] backdrop-blur transition-colors hover:border-[var(--color-neon-amber)] hover:text-[var(--color-neon-amber)]"
            >
              ✕
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * A mini browser window: traffic-light dots + a live address bar, then the
 * magic-reveal of the REAL site. Embeddable sites mount a live <iframe> over a
 * screenshot poster — pointer-events stay OFF (so the pinned scroll keeps
 * working) until you hit "Try it live", which flips them on so you can actually
 * use the running product. Framing-blocked sites show the live screenshot.
 */
function BrowserPreview({
  project,
  focused,
  interacting,
  canEmbed,
  dim,
}: {
  project: Project;
  focused: boolean;
  interacting: boolean;
  canEmbed: boolean;
  dim?: Dim;
}) {
  const [live, setLive] = useState(false); // lazy-mount the iframe once focused
  const [frameOk, setFrameOk] = useState(false);
  const [imgOk, setImgOk] = useState(false);

  useEffect(() => {
    if (focused) setLive(true);
  }, [focused]);

  const fScale = dim && dim.cardW ? dim.cardW / IFRAME_W : 0.3;
  // chrome bar eats the top ~34px; the viewport fills the rest
  const chromeH = 34;
  const viewportH = dim ? dim.cardH - chromeH : 0;
  const iframeH = dim ? Math.ceil(viewportH / fScale) : Math.ceil(IFRAME_W * 1.4);

  return (
    <div className="absolute inset-0 z-[1] flex flex-col">
      {/* browser chrome */}
      <div className="relative z-10 flex h-[34px] shrink-0 items-center gap-2 border-b border-[var(--color-brass)]/15 bg-black/55 px-3 backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-white/5 bg-black/40 px-2 py-1">
          <span className="text-[9px] text-[var(--color-neon-amber)]">●</span>
          <span className="truncate font-mono text-[10px] text-[var(--color-brass-bright)]/85">
            {domainOf(project.live)}
          </span>
        </span>
        <span className="hidden items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--color-neon-amber)] sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-neon-amber)]" />
          live
        </span>
      </div>

      {/* viewport with the magic reveal */}
      <motion.div
        initial={false}
        animate={focused ? "on" : "off"}
        variants={{
          off: { clipPath: "inset(0% 0% 100% 0%)", filter: "blur(16px)", scale: 1.04 },
          on: { clipPath: "inset(0% 0% 0% 0%)", filter: "blur(0px)", scale: 1 },
        }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex-1 overflow-hidden"
      >
        {/* live screenshot — instant poster + the fallback for framing-blocked sites */}
        {project.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image}
            alt={project.imageAlt ?? project.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgOk(true)}
            onError={() => setImgOk(false)}
            className={`absolute inset-0 h-full w-full object-cover object-top brightness-110 contrast-[1.04] saturate-[1.05] transition-opacity duration-500 ${
              imgOk ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        {/* graceful fallback if the screenshot can't load (rate-limit, etc.) */}
        {!imgOk && !canEmbed && (
          <span className="font-display absolute inset-0 grid place-items-center text-2xl font-bold uppercase tracking-tight text-[var(--color-brass)]/50">
            {project.title}
          </span>
        )}

        {/* the REAL running site, scaled to fit; pointer-events flip ON only in
            interact mode so the pinned scroll keeps working otherwise */}
        {canEmbed && live && (
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              src={project.live}
              title={`${project.title} — live`}
              loading="lazy"
              tabIndex={interacting ? 0 : -1}
              scrolling={interacting ? "yes" : "no"}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              onLoad={() => setFrameOk(true)}
              style={{
                width: IFRAME_W,
                height: iframeH,
                transform: `scale(${fScale})`,
                transformOrigin: "top left",
                border: 0,
                pointerEvents: interacting ? "auto" : "none",
                filter: "brightness(1.06) contrast(1.03)",
                opacity: frameOk ? 1 : 0,
                transition: "opacity 600ms ease",
              }}
            />
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
            className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-1/3"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(255,224,170,0.35), transparent)",
            }}
          />
        )}
      </motion.div>
    </div>
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
