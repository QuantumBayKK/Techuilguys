"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Project } from "@/data/projects";
import { PROJECTS } from "@/data/projects";
import { dealerById } from "@/data/dealers";
import { audio } from "@/lib/audio";

/**
 * Reborn — "The studio browser": a browser-in-browser. A simulated browser
 * window (tabs + back/forward/reload + address bar) where visitors pick one of
 * our works from a start page or the tab strip and actually browse through it.
 * Embeddable sites mount the REAL running product as a live <iframe> you can
 * click into (click-to-browse, so the page scroll isn't hijacked by accident);
 * the two that forbid framing show a live screenshot with "open live".
 */

const IFRAME_W = 1280; // reference desktop width the live site renders at

const domainOf = (url?: string) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
};

type View = string | null; // null = the start page (speed dial)

export default function WorksBrowser() {
  const [history, setHistory] = useState<View[]>([null]);
  const [hIndex, setHIndex] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [fine, setFine] = useState(true);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px) and (pointer: fine)");
    const set = () => setFine(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const activeId = history[hIndex];
  const active = useMemo(
    () => (activeId ? PROJECTS.find((p) => p.id === activeId) ?? null : null),
    [activeId]
  );

  // maximize: lock page scroll + Esc steps back out (release scroll, then restore)
  useEffect(() => {
    if (!maximized) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [maximized]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (maximized) setMaximized(false);
      else if (interacting) setInteracting(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maximized, interacting]);

  // a maximized embeddable site should be usable immediately (no click gate)
  useEffect(() => {
    if (!maximized) {
      setInteracting(false);
      return;
    }
    if (active?.embed && active.live && fine) setInteracting(true);
  }, [maximized, active, fine]);

  const navigate = useCallback(
    (id: View) => {
      setInteracting(false);
      setHistory((h) => [...h.slice(0, hIndex + 1), id]);
      setHIndex((i) => i + 1);
      audio.play(id === null ? "flip" : "deal");
    },
    [hIndex]
  );

  const canBack = hIndex > 0;
  const canFwd = hIndex < history.length - 1;
  const back = () => {
    if (!canBack) return;
    setInteracting(false);
    setHIndex((i) => i - 1);
    audio.play("clack");
  };
  const fwd = () => {
    if (!canFwd) return;
    setInteracting(false);
    setHIndex((i) => i + 1);
    audio.play("clack");
  };
  const reload = () => {
    setInteracting(false);
    setReloadKey((k) => k + 1);
    audio.play("flip");
  };

  const addr = active ? domainOf(active.live) : "techuilaguys / works";

  return (
    <section id="rb-browser" className="relative px-4 py-24 sm:px-8 sm:py-32">
      <div className="felt-grain pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />

      <div className="mx-auto mb-8 flex w-full max-w-6xl items-end justify-between">
        <h2 className="misprint font-display text-[clamp(1.8rem,5vw,4rem)] font-bold uppercase leading-none tracking-tight">
          Browse&nbsp;our&nbsp;works
        </h2>
        <p className="hidden max-w-xs text-right text-sm leading-snug text-[var(--color-muted)] sm:block">
          Pick a tab, step inside the live product — hit&nbsp;⤢ to go fullscreen and actually use it.
        </p>
      </div>

      {/* ── the browser window (lifts into a fullscreen overlay when maximized) ── */}
      <div
        className={
          maximized
            ? "fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
            : "relative"
        }
      >
        {maximized && (
          <button
            type="button"
            aria-label="Close fullscreen"
            onClick={() => setMaximized(false)}
            className="absolute inset-0 -z-10 cursor-default"
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-brass)]/25 bg-gradient-to-b from-[#0c0b09] to-black ${
            maximized
              ? "h-[94vh] max-w-[1600px] shadow-[0_50px_140px_-20px_rgba(0,0,0,0.85)]"
              : "mx-auto max-w-6xl shadow-[0_60px_140px_-50px_rgba(255,157,47,0.4)]"
          }`}
          style={maximized ? undefined : { height: "clamp(460px, 76vh, 800px)" }}
        >
        {/* tab strip */}
        <div className="flex items-center gap-1 border-b border-white/5 bg-black/55 px-2.5 pt-2">
          <span className="mr-1.5 flex shrink-0 items-center gap-1.5 px-1.5">
            <button
              type="button"
              aria-label={maximized ? "Restore window" : "Close"}
              onClick={() => setMaximized(false)}
              className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80 transition-transform hover:scale-125"
            />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
            <button
              type="button"
              aria-label={maximized ? "Restore window" : "Maximize window"}
              onClick={() => setMaximized((m) => !m)}
              className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80 transition-transform hover:scale-125"
            />
          </span>
          <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto [scrollbar-width:none]">
            <Tab
              label="New tab"
              glyph="✦"
              active={active === null}
              onClick={() => navigate(null)}
            />
            {PROJECTS.map((p) => (
              <Tab
                key={p.id}
                label={p.title}
                glyph={dealerById(p.dealer).suit}
                active={activeId === p.id}
                onClick={() => navigate(p.id)}
              />
            ))}
          </div>
        </div>

        {/* toolbar */}
        <div className="flex items-center gap-2 border-b border-[var(--color-brass)]/15 bg-black/35 px-3 py-2">
          <div className="flex items-center gap-0.5">
            <NavBtn label="Back" disabled={!canBack} onClick={back}>‹</NavBtn>
            <NavBtn label="Forward" disabled={!canFwd} onClick={fwd}>›</NavBtn>
            <NavBtn label="Reload" onClick={reload}>⟳</NavBtn>
            <NavBtn label="Start page" disabled={active === null} onClick={() => navigate(null)}>
              ⌂
            </NavBtn>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/5 bg-black/50 px-3 py-1.5">
            <span className="text-[10px] text-[var(--color-neon-amber)]">{active ? "🔒" : "✦"}</span>
            <span className="truncate font-mono text-[11px] text-[var(--color-brass-bright)]/85">
              {active ? `https://${addr}` : addr}
            </span>
            {active && (
              <span className="ml-auto hidden items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--color-neon-amber)] sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-neon-amber)]" />
                live
              </span>
            )}
          </div>
          {active?.live && (
            <a
              href={active.live}
              target="_blank"
              rel="noopener noreferrer"
              data-magnetic
              onClick={() => audio.play("flip")}
              className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-brass)]/40 px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.18em] text-[var(--color-brass-bright)] transition-colors hover:border-[var(--color-neon-amber)] hover:text-[var(--color-neon-amber)] sm:inline-flex"
            >
              Open ↗
            </a>
          )}
          <NavBtn
            label={maximized ? "Restore (Esc)" : "Maximize"}
            onClick={() => {
              setMaximized((m) => !m);
              audio.play("flip");
            }}
          >
            {maximized ? "⤡" : "⤢"}
          </NavBtn>
        </div>

        {/* viewport */}
        <div className="relative flex-1 overflow-hidden bg-[var(--color-felt-deep)]">
          <AnimatePresence mode="wait">
            {active === null ? (
              <StartPage key="home" onOpen={navigate} />
            ) : (
              <Viewport
                key={`${active.id}-${reloadKey}`}
                project={active}
                fine={fine}
                interacting={interacting}
                maximized={maximized}
                onInteract={() => {
                  setInteracting(true);
                  audio.play("select");
                }}
                onRelease={() => setInteracting(false)}
              />
            )}
          </AnimatePresence>
        </div>
        </motion.div>
      </div>
    </section>
  );
}

function Tab({
  label,
  glyph,
  active,
  onClick,
}: {
  label: string;
  glyph: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={() => audio.play("hover")}
      className={`group flex h-9 shrink-0 items-center gap-2 rounded-t-lg border-x border-t px-3 text-xs transition-colors ${
        active
          ? "border-[var(--color-brass)]/25 bg-[var(--color-felt-deep)] text-[var(--color-neon-amber)]"
          : "border-transparent bg-black/30 text-[var(--color-muted)] hover:bg-black/45 hover:text-[var(--color-brass-bright)]"
      }`}
    >
      <span className="text-[var(--color-brass)] opacity-80">{glyph}</span>
      <span className="font-display max-w-[12ch] truncate uppercase tracking-[0.12em]">{label}</span>
    </button>
  );
}

function NavBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full text-base text-[var(--color-brass-bright)] transition-colors hover:bg-white/5 hover:text-[var(--color-neon-amber)] disabled:pointer-events-none disabled:opacity-25"
    >
      {children}
    </button>
  );
}

/** The start page / speed dial — pick a work to open. */
function StartPage({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 overflow-y-auto px-5 py-7 sm:px-10 sm:py-10"
    >
      <p className="font-mono mb-1 text-[10px] uppercase tracking-[0.35em] text-[var(--color-faint)]">
        Techuila Guys · the works
      </p>
      <h3 className="font-display mb-6 text-2xl font-bold uppercase tracking-tight text-[var(--color-brass-bright)] sm:text-3xl">
        Where do you want to go?
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PROJECTS.map((p, i) => (
          <motion.button
            key={p.id}
            type="button"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.45 }}
            onClick={() => onOpen(p.id)}
            onPointerEnter={() => audio.play("hover")}
            data-cursor="Open ↗"
            className="group relative flex overflow-hidden rounded-xl border border-[var(--color-line-warm)] bg-black/40 text-left transition-all duration-300 hover:border-[var(--color-neon-amber)]"
          >
            <span className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden sm:w-44">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.imageAlt ?? p.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top brightness-110 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-[var(--color-felt-deep)] to-black" />
              )}
              <span className="font-display absolute right-1.5 top-1 text-lg text-[var(--color-brass)] mix-blend-screen">
                {p.rank}
                {dealerById(p.dealer).suit}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
              <span className="font-display text-xl font-bold uppercase leading-none tracking-tight transition-colors group-hover:text-[var(--color-neon-amber)] sm:text-2xl">
                {p.title}
              </span>
              <span className="font-body mt-1 text-xs text-[var(--color-brass-bright)] sm:text-sm">
                {p.subtitle}
              </span>
              <span className="mt-2 line-clamp-2 text-[11px] leading-snug text-[var(--color-muted)]">
                {p.blurb}
              </span>
              <span className="font-mono mt-2 flex items-center gap-1.5 text-[10px] text-[var(--color-faint)]">
                <span className="text-[var(--color-neon-amber)]">●</span>
                {domainOf(p.live)}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/** The active work's viewport — live iframe (click-to-browse) or screenshot. */
function Viewport({
  project,
  fine,
  interacting,
  maximized,
  onInteract,
  onRelease,
}: {
  project: Project;
  fine: boolean;
  interacting: boolean;
  maximized: boolean;
  onInteract: () => void;
  onRelease: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [frameOk, setFrameOk] = useState(false);
  const [imgOk, setImgOk] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const canEmbed = !!project.embed && !!project.live && fine && size.w > 0;
  const scale = size.w / IFRAME_W;
  const iframeH = scale ? Math.ceil(size.h / scale) : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 overflow-hidden"
    >
      {/* curtain magic-reveal on every load */}
      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)", filter: "blur(14px)" }}
        animate={{ clipPath: "inset(0 0 0% 0)", filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        {/* screenshot poster + fallback */}
        {project.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image}
            alt={project.imageAlt ?? project.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgOk(true)}
            onError={() => setImgOk(false)}
            className={`absolute inset-0 h-full w-full object-cover object-top brightness-110 contrast-[1.04] transition-opacity duration-500 ${
              imgOk ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        {!imgOk && !canEmbed && (
          <span className="font-display absolute inset-0 grid place-items-center text-3xl font-bold uppercase tracking-tight text-[var(--color-brass)]/40">
            {project.title}
          </span>
        )}

        {/* the REAL running product */}
        {canEmbed && (
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
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              border: 0,
              pointerEvents: interacting ? "auto" : "none",
              opacity: frameOk ? 1 : 0,
              transition: "opacity 500ms ease",
            }}
          />
        )}
      </motion.div>

      {/* light sweep on load */}
      <motion.span
        aria-hidden
        initial={{ y: "-110%" }}
        animate={{ y: "120%" }}
        transition={{ duration: 0.95, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/3"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(255,224,170,0.3), transparent)",
        }}
      />

      {/* click-to-browse gate for embeddable sites (keeps page scroll free) */}
      {canEmbed && !interacting && (
        <button
          type="button"
          onClick={onInteract}
          data-cursor="Click to browse"
          className="group absolute inset-0 z-20 grid place-items-center bg-black/0 transition-colors hover:bg-black/20"
        >
          <span className="flex items-center gap-2 rounded-full border border-[var(--color-neon-amber)]/50 bg-black/60 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-[var(--color-neon-amber)] opacity-90 backdrop-blur transition-transform duration-300 group-hover:scale-105">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-neon-amber)]" />
            Click to browse this site
          </span>
        </button>
      )}

      {/* release-scroll chip while browsing inside (redundant in fullscreen) */}
      {canEmbed && interacting && !maximized && (
        <button
          type="button"
          onClick={onRelease}
          className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-[var(--color-brass)]/40 bg-black/65 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-brass-bright)] backdrop-blur transition-colors hover:border-[var(--color-neon-amber)] hover:text-[var(--color-neon-amber)]"
        >
          ✕ release scroll
        </button>
      )}

      {/* non-embeddable: can't run inline, offer the real thing */}
      {!canEmbed && project.live && (
        <a
          href={project.live}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => audio.play("flip")}
          data-cursor="Open live ↗"
          className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--color-neon-amber)]/55 bg-black/65 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-[var(--color-neon-amber)] backdrop-blur transition-transform duration-300 hover:scale-105"
        >
          Open the live site ↗
        </a>
      )}
    </motion.div>
  );
}
