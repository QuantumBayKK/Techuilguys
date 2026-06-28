"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The room is watching. A deliberately uncanny background layer for /reborn:
 *  - EYES in the dark whose pupils track your cursor.
 *  - occasional GLITCH tears (RGB-split scanline bands).
 *  - a faint techy SYSTEM LOG muttering to itself in a corner.
 * All pointer-events-none, behind content, and fully disabled under
 * reduced-motion (it's a lot of motion and it's meant to unsettle).
 */

const EYES = [
  { x: "7vw", y: "22vh", s: 26 },
  { x: "90vw", y: "38vh", s: 20 },
  { x: "16vw", y: "78vh", s: 30 },
  { x: "84vw", y: "82vh", s: 22 },
  { x: "50vw", y: "12vh", s: 16 },
];

const LOG_LINES = [
  "› dealer.daemon awake",
  "› reading visitor.intent …",
  "› shuffle entropy = 0x9F3A21",
  "› tell detected: hesitation",
  "› the house always wins",
  "› ace.mood = watching",
  "› counting your cards …",
  "› bluff probability 0.61",
  "› do not look away",
  "› reshuffling reality …",
  "› you are being dealt in",
  "› 11 eyes on the table",
  "› cache miss: trust",
  "› smile detected. logging.",
];

export default function WeirdBackground() {
  const [enabled, setEnabled] = useState(false);
  const [glitch, setGlitch] = useState<{ top: number; h: number; shift: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const eyeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pupilRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // desktop, fine-pointer only — the eyes track a cursor and it's heavy on phones
    if (reduced || coarse) return;
    setEnabled(true);
  }, []);

  // pupils track the cursor
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const frame = () => {
      eyeRefs.current.forEach((eye, i) => {
        const pupil = pupilRefs.current[i];
        if (!eye || !pupil) return;
        const r = eye.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const a = Math.atan2(ty - cy, tx - cx);
        const reach = r.width * 0.18;
        pupil.style.transform = `translate(${Math.cos(a) * reach}px, ${Math.sin(a) * reach}px)`;
      });
      raf = requestAnimationFrame(frame);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  // occasional glitch tears
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setGlitch({
        top: Math.random() * 90,
        h: 2 + Math.random() * 26,
        shift: (Math.random() - 0.5) * 24,
      });
      window.setTimeout(() => setGlitch(null), 120 + Math.random() * 160);
      timer = setTimeout(tick, 2600 + Math.random() * 6000);
    };
    timer = setTimeout(tick, 2400);
    return () => clearTimeout(timer);
  }, [enabled]);

  // muttering system log
  useEffect(() => {
    if (!enabled) return;
    let i = Math.floor(Math.random() * LOG_LINES.length);
    const tick = () => {
      i = (i + 1) % LOG_LINES.length;
      setLog((l) => [...l.slice(-7), LOG_LINES[i]]);
    };
    const id = setInterval(tick, 1500);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[3] overflow-hidden">
      {/* eyes */}
      {EYES.map((e, i) => (
        <span
          key={i}
          ref={(el) => {
            eyeRefs.current[i] = el;
          }}
          className="weird-eye absolute grid place-items-center rounded-full"
          style={{
            left: e.x,
            top: e.y,
            width: e.s,
            height: e.s * 0.62,
            background: "radial-gradient(circle, rgba(20,16,10,0.9), rgba(8,6,4,0.4) 70%, transparent)",
            boxShadow: "0 0 14px rgba(0,0,0,0.8)",
          }}
        >
          <span
            ref={(el) => {
              pupilRefs.current[i] = el;
            }}
            className="block rounded-full"
            style={{
              width: e.s * 0.34,
              height: e.s * 0.34,
              background: "var(--color-neon-amber)",
              boxShadow: "0 0 8px var(--color-neon-amber)",
              transition: "transform 0.12s ease-out",
            }}
          />
        </span>
      ))}

      {/* glitch tear */}
      {glitch && (
        <div
          className="absolute left-0 right-0"
          style={{
            top: `${glitch.top}vh`,
            height: glitch.h,
            background:
              "repeating-linear-gradient(90deg, rgba(255,0,80,0.18) 0 2px, rgba(0,255,200,0.16) 2px 4px, transparent 4px 7px)",
            transform: `translateX(${glitch.shift}px)`,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* muttering system log */}
      <div className="absolute bottom-4 left-4 select-none font-mono text-[10px] leading-relaxed text-[var(--color-faint)]/50">
        {log.map((line, i) => (
          <div
            key={`${line}-${i}`}
            style={{ opacity: 0.25 + (i / Math.max(1, log.length)) * 0.6 }}
          >
            {line}
          </div>
        ))}
        <div className="weird-caret inline-block h-2 w-1.5 bg-[var(--color-neon-amber)]/60" />
      </div>
    </div>
  );
}
