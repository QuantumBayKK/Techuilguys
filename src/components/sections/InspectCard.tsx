"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PROJECTS } from "@/data/projects";
import { CardFront, CardBack } from "@/components/cards/CardFaces";
import { experience, useExperience } from "@/lib/experience";
import { audio } from "@/lib/audio";

/**
 * "Uncharted" artifact mode. The chosen card lifts to center; the rest of the
 * hand blurs back. Drag to rotate freely with inertia; flip on double-click /
 * the Flip affordance to read what it does + the tech stack.
 */
export default function InspectCard() {
  const { stage, inspectId } = useExperience();
  const project = PROJECTS.find((p) => p.id === inspectId) ?? null;
  const open = stage === "inspect" && !!project;

  const [flipped, setFlipped] = useState(false);
  const rot = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // reset on open
  useEffect(() => {
    if (open) {
      setFlipped(false);
      rot.current = { x: 0, y: 0, vx: 0, vy: 0 };
    }
  }, [open, inspectId]);

  // inertial rotation loop
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const loop = () => {
      const r = rot.current;
      if (!dragging.current) {
        r.x += r.vx;
        r.y += r.vy;
        r.vx *= 0.92;
        r.vy *= 0.92;
        // ease back toward rest when nearly still
        if (Math.abs(r.vx) < 0.02 && Math.abs(r.vy) < 0.02) {
          r.x += (0 - r.x) * 0.06;
          r.y += ((flipped ? 180 : 0) - r.y) * 0.06;
        }
      }
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${r.x}deg) rotateY(${r.y}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open, flipped]);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    rot.current.y += dx * 0.5;
    rot.current.x = Math.max(-50, Math.min(50, rot.current.x - dy * 0.4));
    rot.current.vy = dx * 0.5;
    rot.current.vx = -dy * 0.4;
  };
  const onUp = () => {
    dragging.current = false;
  };

  const flip = () => {
    audio.play("flip");
    setFlipped((f) => {
      rot.current.y = f ? 0 : 180;
      rot.current.vy = 0;
      return !f;
    });
  };

  const close = () => {
    audio.play("flip");
    experience.set({ stage: "dealt", inspectId: null });
  };

  return (
    <AnimatePresence>
      {open && project && (
        <motion.div
          key="inspect"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* backdrop dim + click-away */}
          <button
            aria-label="Back to hand"
            data-cursor="Back"
            onClick={close}
            className="absolute inset-0 bg-[var(--color-noir)]/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.7, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 130, damping: 14 }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <div
              style={{ perspective: 1600 }}
              className="h-[62vh] max-h-[560px] w-[44vh] max-w-[400px]"
            >
              <div
                ref={cardRef}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onDoubleClick={flip}
                data-cursor="Drag"
                className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <CardFront project={project} />
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <CardBack project={project} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                data-cursor="Flip"
                data-magnetic
                onClick={flip}
                className="font-display rounded-full border border-[var(--color-line-warm)] px-5 py-2 text-[11px] uppercase tracking-[0.3em] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-neon-amber)]/10"
              >
                {flipped ? "View face" : "Flip · see the build"}
              </button>
              <button
                data-cursor="Back"
                data-magnetic
                onClick={close}
                className="font-display rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)] hover:text-[var(--color-neon-amber)]"
              >
                ← Back to hand
              </button>
            </div>
            <p className="text-[10px] tracking-[0.2em] text-[var(--color-faint)]">
              DRAG TO ROTATE · DOUBLE-CLICK TO FLIP
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
