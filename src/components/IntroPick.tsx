"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";
import { DEALERS, type Dealer, type DealerId } from "@/data/dealers";
import { experience, useExperience } from "@/lib/experience";
import { useCapability } from "@/lib/useCapability";
import { audio } from "@/lib/audio";
import { SHUFFLE_LINES } from "@/lib/dealerPatter";

/**
 * The entry. A full-screen loader: a 3D poker chip spins, shatters, and the
 * burst hands off to the two real dealer cards (the exact framed-portrait
 * design) which rise into place and ARE the pick. Choosing one deals that hand
 * and dismisses the loader. Reduced-motion / no-WebGL skips straight to the
 * cards. Replaces the old title + pick sections.
 */
const IntroChip3D = dynamic(() => import("@/components/three/IntroChip3D"), {
  ssr: false,
});

export default function IntroPick() {
  const { dealer } = useExperience();
  const cap = useCapability();
  const [webgl, setWebgl] = useState(true);
  const [shattered, setShattered] = useState(false);
  const [canvasGone, setCanvasGone] = useState(false);
  const [hover, setHover] = useState<DealerId | null>(null);
  const [picked, setPicked] = useState<DealerId | null>(null);
  const [gone, setGone] = useState(false);
  const [patter, setPatter] = useState(0);

  // #72 — cycle the dealer's shuffle patter while the deck loads in.
  useEffect(() => {
    if (shattered) return;
    const id = window.setInterval(
      () => setPatter((p) => (p + 1) % SHUFFLE_LINES.length),
      900
    );
    return () => window.clearInterval(id);
  }, [shattered]);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(
        !!(
          window.WebGLRenderingContext &&
          (c.getContext("webgl") || c.getContext("experimental-webgl"))
        )
      );
    } catch {
      setWebgl(false);
    }
  }, []);

  const use3D = cap.ready && webgl && !cap.reducedMotion;

  // Without 3D, reveal the cards as soon as we know the device.
  useEffect(() => {
    if (cap.ready && !use3D) setShattered(true);
  }, [cap.ready, use3D]);

  // Free the WebGL context shortly after the handoff.
  useEffect(() => {
    if (!shattered || !use3D) return;
    const id = window.setTimeout(() => setCanvasGone(true), 1300);
    return () => window.clearTimeout(id);
  }, [shattered, use3D]);

  // Lock scroll while the loader owns the screen.
  useEffect(() => {
    if (gone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [gone]);

  useEffect(() => {
    if (dealer && !picked) setPicked(dealer);
  }, [dealer, picked]);

  const pick = (id: DealerId) => {
    if (picked) return;
    audio.unlock();
    audio.play("select");
    audio.startBed();
    experience.set({ dealer: id, started: true });
    setPicked(id);
    document.body.style.cursor = "";
    window.setTimeout(() => setGone(true), 1000);
  };

  if (gone) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: picked ? 0 : 1 }}
      transition={{ duration: 0.9, ease: [0.65, 0.05, 0.36, 1] }}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-between overflow-hidden bg-[var(--color-noir)]"
      style={{ pointerEvents: picked ? "none" : "auto" }}
    >
      {/* top wordmark */}
      <div className="pointer-events-none z-10 pt-[6vh] text-center">
        <p className="font-script text-2xl text-[var(--color-brass-bright)] sm:text-3xl">
          welcome to the
        </p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-[var(--color-ink)] sm:text-5xl">
          Techuila <span className="text-[var(--color-neon-amber)]">Guys</span>
        </h1>
      </div>

      {/* stage */}
      <div className="relative flex w-full flex-1 items-center justify-center">
        {/* 3D chip + shatter (fades out at handoff) */}
        {use3D && !canvasGone && (
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: shattered ? 0 : 1, pointerEvents: shattered ? "none" : "auto" }}
          >
            <IntroChip3D onDone={() => setShattered(true)} />
          </div>
        )}

        {/* the real dealer cards — rise out of the burst, and are the pick */}
        <AnimatePresence>
          {shattered && (
            <div className="flex w-full max-w-3xl items-center justify-center gap-6 px-6 sm:gap-14">
              {DEALERS.map((d, i) => {
                const isChosen = picked === d.id;
                const dim = (hover && hover !== d.id) || (picked != null && !isChosen);
                return (
                  <motion.button
                    key={d.id}
                    data-cursor={picked ? undefined : "Deal"}
                    data-magnetic
                    disabled={picked != null}
                    onMouseEnter={() => {
                      if (picked) return;
                      setHover(d.id);
                      audio.play("hover");
                    }}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => pick(d.id)}
                    initial={{ y: 80, opacity: 0, scale: 0.8, rotateZ: i === 0 ? -8 : 8 }}
                    animate={{
                      y: dim ? 14 : 0,
                      opacity: dim ? 0.45 : 1,
                      scale: isChosen ? 1.06 : hover === d.id ? 1.04 : 1,
                      rotateZ: 0,
                    }}
                    transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 110, damping: 16 }}
                    className="group relative w-[42vw] max-w-[280px]"
                    style={{ perspective: 1100 }}
                  >
                    <CourtPortrait dealer={d} active={hover === d.id || isChosen} />
                  </motion.button>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* prompt */}
      <div className="z-10 flex flex-col items-center gap-1 pb-[6vh] text-center">
        {shattered && !picked ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col items-center gap-1"
          >
            <p className="font-display text-sm uppercase tracking-[0.5em] text-[var(--color-brass)]">
              Pick your dealer
            </p>
            <p className="text-[11px] tracking-wide text-[var(--color-muted)]">
              Tap a card to be dealt their hand
            </p>
          </motion.div>
        ) : !shattered ? (
          <p className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--color-muted)]">
            {SHUFFLE_LINES[patter]}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

/** The framed dealer card — restored exactly: portrait, suit corners, name,
 *  rank, tagline, neon rim + cursor tilt + sheen. */
function CourtPortrait({ dealer, active }: { dealer: Dealer; active: boolean }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [9, -9]), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(px, [0, 1], [-11, 11]), { stiffness: 140, damping: 16 });
  const sheenX = useTransform(px, [0, 1], ["0%", "100%"]);

  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        rotateX: active ? rx : 0,
        rotateY: active ? ry : 0,
        transformStyle: "preserve-3d",
        borderColor: active ? "var(--color-neon-amber)" : "var(--color-line)",
        boxShadow: active
          ? "0 30px 80px -20px var(--color-neon-amber), inset 0 0 0 1px rgba(255,157,47,0.4)"
          : "var(--shadow-table)",
      }}
      className="relative aspect-[3/4.4] overflow-hidden rounded-[var(--radius-card)] border-2 transition-[box-shadow,border-color] duration-300"
    >
      <div className="pointer-events-none absolute inset-2 z-20 rounded-[10px] border border-[var(--color-brass)]/40" />
      <span className="font-display absolute left-3 top-2 z-20 text-sm text-[var(--color-brass)]">
        {dealer.suit}
      </span>
      <span className="font-display absolute bottom-2 right-3 z-20 rotate-180 text-sm text-[var(--color-brass)]">
        {dealer.suit}
      </span>

      <Image
        src={dealer.portrait}
        alt={dealer.name}
        fill
        sizes="280px"
        className="object-cover transition-all duration-700"
        style={{
          filter: active
            ? "grayscale(0) contrast(1.05) saturate(1.12)"
            : "grayscale(0.92) contrast(1.28) brightness(0.8) sepia(0.18)",
          transform: active ? "scale(1.08)" : "scale(1)",
        }}
        priority
      />

      <div
        className="absolute inset-0 z-10 mix-blend-color transition-opacity duration-500"
        style={{
          opacity: active ? 0 : 0.45,
          background: "linear-gradient(180deg, var(--color-felt-deep), var(--color-noir))",
        }}
      />

      <motion.div
        className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay"
        style={{
          opacity: active ? 0.6 : 0,
          background: useTransform(
            sheenX,
            (x) => `radial-gradient(40% 55% at ${x} 18%, rgba(255,230,180,0.55), transparent 70%)`
          ),
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[var(--color-noir)] via-[var(--color-noir)]/70 to-transparent p-4 pt-12"
        style={{ transform: "translateZ(30px)" }}
      >
        <p
          className="font-display text-2xl font-bold uppercase tracking-tight transition-colors duration-300"
          style={{ color: active ? "var(--color-neon-amber)" : "var(--color-ink)" }}
        >
          {dealer.name}
        </p>
        <p className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--color-brass)]">
          {dealer.rank}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--color-muted)]">
          {dealer.tagline}
        </p>
      </div>
    </motion.div>
  );
}
