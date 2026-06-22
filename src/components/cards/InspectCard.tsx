"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CardFront, CardBack } from "@/components/cards/CardFaces";
import ProjectLinks from "@/components/cards/ProjectLinks";
import { inspect, useInspect } from "@/lib/inspect";
import { audio } from "@/lib/audio";

/**
 * Artifact mode. The chosen card lifts to center over a dimmed backdrop; drag
 * to rotate it freely in 3D with inertia, flip (double-click / button) to read
 * what it does + the full tech stack. Closing returns to the scroll.
 */
export default function InspectCard() {
  const project = useInspect();
  const open = !!project;

  const [flipped, setFlipped] = useState(false);
  const rot = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setFlipped(false);
      rot.current = { x: 0, y: 0, vx: 0, vy: 0 };
    }
  }, [open, project?.id]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // inertial rotation loop + idle showcase spin
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const loop = () => {
      const r = rot.current;
      if (!dragging.current) {
        r.x += r.vx;
        r.y += r.vy;
        r.vx *= 0.93;
        r.vy *= 0.93;
        if (Math.abs(r.vx) < 0.03 && Math.abs(r.vy) < 0.03) {
          // gentle auto-showcase: keep a slow turn + settle pitch toward level
          r.y += 0.12;
          r.x += ((flipped ? 0 : 0) - r.x) * 0.04;
        }
      }
      if (cardRef.current) {
        const base = flipped ? 180 : 0;
        cardRef.current.style.transform = `rotateX(${r.x}deg) rotateY(${base + r.y}deg)`;
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
    rot.current.x = Math.max(-55, Math.min(55, rot.current.x - dy * 0.4));
    rot.current.vy = dx * 0.5;
    rot.current.vx = -dy * 0.4;
  };
  const onUp = () => {
    dragging.current = false;
  };

  const flip = () => {
    audio.play("flip");
    setFlipped((f) => !f);
    rot.current.y = 0;
    rot.current.vy = 0;
  };

  const close = () => {
    audio.play("flip");
    inspect.close();
  };

  return (
    <AnimatePresence>
      {open && project && (
        <motion.div
          key="inspect"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto p-4"
        >
          <button
            aria-label="Close"
            data-cursor="Close"
            onClick={close}
            className="absolute inset-0 bg-[var(--color-noir)]/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.7, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 130, damping: 15 }}
            className="relative z-10 flex flex-col items-center gap-5 py-4"
          >
            <div
              style={{ perspective: 1600 }}
              className="h-[min(58vh,520px)] w-[min(82vw,calc(58vh*0.71))] max-w-[380px]"
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
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                  <CardFront project={project} />
                </div>
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
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
                data-cursor="Close"
                data-magnetic
                onClick={close}
                className="font-display rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)] hover:text-[var(--color-neon-amber)]"
              >
                ← Back
              </button>
            </div>
            <ProjectLinks project={project} />

            <p className="text-[10px] tracking-[0.2em] text-[var(--color-faint)]">
              DRAG TO ROTATE · FLIP FOR THE BUILD · ESC TO CLOSE
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
