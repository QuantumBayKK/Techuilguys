"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DEALERS, type DealerId } from "@/data/dealers";
import { experience, useExperience } from "@/lib/experience";
import { useCapability } from "@/lib/useCapability";
import { audio } from "@/lib/audio";

/**
 * The entry. A full-screen loader where a 3D poker chip spins, shatters and
 * forms the two dealer cards — and those cards ARE the pick. Choosing one deals
 * that hand and dismisses the loader to reveal the story. On reduced-motion /
 * no-WebGL it shows a 2D portrait pick instead. This replaces the old separate
 * title + pick sections.
 */
const IntroChip3D = dynamic(() => import("@/components/three/IntroChip3D"), {
  ssr: false,
});

export default function IntroPick() {
  const { dealer } = useExperience();
  const cap = useCapability();
  const [webgl, setWebgl] = useState(true);
  const [ready, setReady] = useState(false);
  const [picked, setPicked] = useState<DealerId | null>(null);
  const [gone, setGone] = useState(false);

  // WebGL feature-detect
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
  // The 2D fallback is ready to pick immediately.
  const promptReady = use3D ? ready : cap.ready;

  // Lock scroll while the loader owns the screen.
  useEffect(() => {
    if (gone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [gone]);

  // If a dealer somehow gets set elsewhere, make sure we dismiss.
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
    // let the dismiss fade play, then unmount + restore scroll
    window.setTimeout(() => setGone(true), 950);
  };

  if (gone) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intropick"
        initial={{ opacity: 1 }}
        animate={{ opacity: picked ? 0 : 1 }}
        transition={{ duration: 0.85, ease: [0.65, 0.05, 0.36, 1] }}
        className="fixed inset-0 z-[120] flex flex-col items-center justify-between overflow-hidden bg-[var(--color-noir)]"
        style={{ pointerEvents: picked ? "none" : "auto" }}
      >
        {/* top wordmark */}
        <div className="pointer-events-none z-10 pt-[7vh] text-center">
          <p className="font-script text-2xl text-[var(--color-brass-bright)] sm:text-3xl">
            welcome to the
          </p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-[var(--color-ink)] sm:text-5xl">
            Techuila <span className="text-[var(--color-neon-amber)]">Guys</span>
          </h1>
        </div>

        {/* the stage — 3D loader/pick, or 2D fallback */}
        <div className="relative w-full flex-1">
          {use3D ? (
            <div className="absolute inset-0">
              <IntroChip3D onReady={() => setReady(true)} onPick={pick} picked={picked} />
            </div>
          ) : (
            <FallbackPick onPick={pick} picked={picked} />
          )}
        </div>

        {/* prompt */}
        <div className="z-10 flex flex-col items-center gap-2 pb-[7vh] text-center">
          <AnimatePresence>
            {promptReady && !picked && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center gap-1"
              >
                <p className="font-display text-sm uppercase tracking-[0.5em] text-[var(--color-brass)]">
                  Pick your dealer
                </p>
                <p className="text-[11px] tracking-wide text-[var(--color-muted)]">
                  Tap a card to be dealt their hand
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!promptReady && (
            <p className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--color-muted)]">
              dealing in<span className="loading-dots" />
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** 2D portrait pick — reduced-motion / no-WebGL fallback. */
function FallbackPick({
  onPick,
  picked,
}: {
  onPick: (id: DealerId) => void;
  picked: DealerId | null;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-5 px-6 sm:gap-12">
      {DEALERS.map((d) => {
        const dim = picked != null && picked !== d.id;
        return (
          <motion.button
            key={d.id}
            disabled={picked != null}
            onClick={() => onPick(d.id)}
            animate={{ opacity: dim ? 0.35 : 1, scale: picked === d.id ? 1.05 : 1 }}
            whileHover={picked == null ? { scale: 1.04, y: -6 } : undefined}
            className="group relative aspect-[3/4.4] w-[42vw] max-w-[260px] overflow-hidden rounded-[var(--radius-card)] border-2 border-[var(--color-line)] transition-colors hover:border-[var(--color-neon-amber)]"
          >
            <Image
              src={d.portrait}
              alt={d.name}
              fill
              sizes="260px"
              className="object-cover transition-all duration-500 group-hover:scale-105"
              style={{ filter: "contrast(1.1) saturate(1.05)" }}
              priority
            />
            <span className="font-display absolute left-3 top-2 z-10 text-lg text-[var(--color-brass)]">
              {d.suit}
            </span>
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--color-noir)] via-[var(--color-noir)]/70 to-transparent p-4 pt-10 text-left">
              <p className="font-display text-xl font-bold uppercase tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-neon-amber)]">
                {d.name}
              </p>
              <p className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--color-brass)]">
                {d.rank}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
