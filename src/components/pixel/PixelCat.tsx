"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/lib/useInView";
import { useCapability } from "@/lib/useCapability";
import { audio } from "@/lib/audio";

/**
 * The lounge mascot: an original, interactive pixel-art cat drawn to a canvas
 * (crisp integer-scaled pixels, game-sprite style). It has a small mood state
 * machine — idle breathing + tail swish, randomized blinks, eyes that follow
 * your cursor, happy + purring with floating hearts when you pet it (hover),
 * an open-mouth meow + hop when you click, and it curls up to sleep (closed
 * eyes + Zzz) when left alone, waking when you move. Redrawn at ~16fps and
 * fully paused when off-screen, so it costs almost nothing.
 */

const LW = 72; // logical pixel grid
const LH = 72;
const CX = 36;

const P = {
  OUT: "#231310",
  FUR: "#ec9b45",
  DK: "#c4671f",
  CREAM: "#f7e6bf",
  PINK: "#e7889b",
  EYE: "#37e6cf",
  PUP: "#0d1c1a",
  SHINE: "#fbf4e6",
  BOW: "#ff9d2f",
  MOUTH: "#7a2230",
  WHISK: "#d9c89f",
};

// silhouette half-widths per row (rounded pixel blobs)
const HEAD = [6, 10, 13, 15, 16, 17, 18, 18, 19, 19, 19, 19, 19, 19, 19, 18, 18, 17, 16, 15, 13, 10, 7, 4];
const BODY = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 22, 23, 23, 23, 23, 22, 21, 19, 16, 12, 8];
const BELLY = [5, 7, 9, 10, 11, 11, 11, 11, 10, 9, 7, 5];

type St = {
  eye: "open" | "blink" | "happy" | "sleep" | "wide";
  mouth: "neutral" | "happy" | "meow";
  gx: number;
  gy: number;
  tail: number;
  hop: number;
  ear: number;
  sleep: boolean;
  t: number;
};

function span(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, c: string) {
  if (x1 < x0) return;
  ctx.fillStyle = c;
  ctx.fillRect(x0 | 0, y | 0, (x1 - x0 + 1) | 0, 1);
}
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}
function blob(ctx: CanvasRenderingContext2D, cx: number, top: number, widths: number[], fur: string) {
  const n = widths.length;
  for (let i = 0; i < n; i++) span(ctx, cx - widths[i], cx + widths[i], top + i, P.OUT);
  for (let i = 1; i < n - 1; i++) {
    const w = widths[i] - 1;
    if (w >= 0) span(ctx, cx - w, cx + w, top + i, fur);
  }
}

const Z_GLYPH = ["111", "001", "010", "100", "111"];
function drawZ(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) {
  ctx.fillStyle = c;
  for (let r = 0; r < Z_GLYPH.length; r++)
    for (let col = 0; col < 3; col++)
      if (Z_GLYPH[r][col] === "1") ctx.fillRect((x + col) | 0, (y + r) | 0, 1, 1);
}

const HEART = [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."];
function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) {
  ctx.fillStyle = c;
  for (let r = 0; r < HEART.length; r++)
    for (let col = 0; col < 5; col++)
      if (HEART[r][col] === "X") ctx.fillRect((x + col) | 0, (y + r) | 0, 1, 1);
}

function drawCat(ctx: CanvasRenderingContext2D, st: St) {
  ctx.clearRect(0, 0, LW, LH);

  // ground shadow (does not hop)
  const sw = 22 - st.hop * 1.2;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect((CX - sw) | 0, 67, (sw * 2) | 0, 2);

  ctx.save();
  ctx.translate(0, -st.hop);

  // tail (behind body), striped, swishing
  for (let s = 0; s <= 10; s++) {
    const f = s / 10;
    const x = CX + 17 + f * 9 + Math.sin(st.tail + f * 4) * 3;
    const y = 55 - f * 24;
    rect(ctx, x - 2, y - 2, 5, 5, P.OUT);
    rect(ctx, x - 1, y - 1, 3, 3, s > 8 ? P.DK : P.FUR);
    if (s % 2 === 0) rect(ctx, x - 1, y - 1, 3, 1, P.DK);
  }

  // body + belly
  blob(ctx, CX, 36, BODY, P.FUR);
  blob(ctx, CX, 47, BELLY, P.CREAM);
  // body stripes
  rect(ctx, CX - 14, 40, 3, 6, P.DK);
  rect(ctx, CX + 12, 40, 3, 6, P.DK);

  // ears (drawn before head so head covers their base)
  const earW = [0, 1, 2, 3, 4, 5, 6, 7];
  const earIn = [0, 0, 1, 2, 3, 3];
  blob(ctx, CX - 13 - st.ear, 1, earW, P.FUR);
  blob(ctx, CX + 13 + st.ear, 1, earW, P.FUR);
  blob(ctx, CX - 13 - st.ear, 3, earIn, P.PINK);
  blob(ctx, CX + 13 + st.ear, 3, earIn, P.PINK);

  // head
  blob(ctx, CX, 7, HEAD, P.FUR);
  // head stripes (forehead)
  rect(ctx, CX - 1, 8, 2, 5, P.DK);
  rect(ctx, CX - 6, 9, 2, 4, P.DK);
  rect(ctx, CX + 5, 9, 2, 4, P.DK);
  // cream muzzle
  blob(ctx, CX, 20, [6, 8, 9, 9, 8, 6], P.CREAM);

  // eyes
  const eyeY = 17;
  for (const ex of [CX - 8, CX + 8]) {
    if (st.eye === "blink") {
      span(ctx, ex - 3, ex + 3, eyeY + 1, P.OUT);
    } else if (st.eye === "sleep") {
      span(ctx, ex - 3, ex + 3, eyeY + 2, P.OUT);
      span(ctx, ex - 2, ex + 2, eyeY + 3, P.PINK);
    } else if (st.eye === "happy") {
      // upward arc ^_^
      rect(ctx, ex - 3, eyeY, 1, 1, P.OUT);
      rect(ctx, ex + 3, eyeY, 1, 1, P.OUT);
      span(ctx, ex - 2, ex + 2, eyeY - 1, P.OUT);
    } else {
      // open: outline box, white, teal iris (gaze), pupil + shine
      rect(ctx, ex - 3, eyeY - 3, 7, 7, P.OUT);
      rect(ctx, ex - 2, eyeY - 2, 5, 5, P.SHINE);
      const big = st.eye === "wide" ? 1 : 0;
      const ix = ex - 1 + st.gx;
      const iy = eyeY - 1 + st.gy;
      rect(ctx, ix - big, iy - big, 3 + big, 3 + big, P.EYE);
      rect(ctx, ix, iy, 1, 1, P.PUP);
      rect(ctx, ix - 1, iy - 1, 1, 1, P.SHINE);
    }
  }

  // nose
  span(ctx, CX - 1, CX + 1, 23, P.PINK);
  rect(ctx, CX, 24, 1, 1, P.PINK);

  // mouth
  if (st.mouth === "meow") {
    rect(ctx, CX - 2, 25, 5, 4, P.MOUTH);
    rect(ctx, CX - 1, 27, 3, 1, P.PINK);
  } else if (st.mouth === "happy") {
    span(ctx, CX - 3, CX - 1, 26, P.OUT);
    span(ctx, CX + 1, CX + 3, 26, P.OUT);
    rect(ctx, CX, 25, 1, 1, P.OUT);
  } else {
    rect(ctx, CX, 25, 1, 1, P.OUT);
    rect(ctx, CX - 2, 26, 2, 1, P.OUT);
    rect(ctx, CX + 1, 26, 2, 1, P.OUT);
  }

  // whiskers
  rect(ctx, CX - 14, 22, 4, 1, P.WHISK);
  rect(ctx, CX - 14, 25, 4, 1, P.WHISK);
  rect(ctx, CX + 11, 22, 4, 1, P.WHISK);
  rect(ctx, CX + 11, 25, 4, 1, P.WHISK);

  // bow-tie collar (poker amber)
  rect(ctx, CX - 5, 33, 4, 4, P.BOW);
  rect(ctx, CX + 2, 33, 4, 4, P.BOW);
  rect(ctx, CX - 1, 33, 2, 4, P.DK);

  // front paws
  for (const px of [CX - 9, CX + 9]) {
    rect(ctx, px - 4, 60, 9, 8, P.OUT);
    rect(ctx, px - 3, 60, 7, 7, P.CREAM);
    rect(ctx, px - 1, 62, 1, 4, P.OUT);
    rect(ctx, px + 1, 62, 1, 4, P.OUT);
  }

  ctx.restore();

  // Zzz when sleeping
  if (st.sleep) {
    const fl = (st.t / 600) % 1;
    drawZ(ctx, CX + 16, 10 - fl * 6, P.WHISK);
    drawZ(ctx, CX + 20, 6 - ((fl + 0.5) % 1) * 6, P.CREAM);
  }
}

export default function PixelCat() {
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cap = useCapability();
  const [mood, setMood] = useState<"idle" | "happy" | "sleep">("idle");

  const gaze = useRef({ x: 0, y: 0 });
  const lastActivity = useRef(0);
  const happyUntil = useRef(0);
  const meowUntil = useRef(0);
  const blinkUntil = useRef(0);
  const nextBlink = useRef(1800);
  const earTwitchUntil = useRef(0);
  const nextTwitch = useRef(3000);
  const nextLook = useRef(2000);
  const moodRef = useRef<"idle" | "happy" | "sleep">("idle");
  const hearts = useRef<{ x: number; y: number; life: number; c: string }[]>([]);

  // set up the crisp pixel canvas
  const setup = () => {
    const cv = canvasRef.current;
    if (!cv) return null;
    const S = 5;
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    cv.width = LW * S * dpr;
    cv.height = LH * S * dpr;
    cv.style.width = LW * S + "px";
    cv.style.height = LH * S + "px";
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(S * dpr, 0, 0, S * dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    return ctx;
  };

  // cursor → gaze + wake
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      lastActivity.current = performance.now();
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      gaze.current.x = Math.max(-1, Math.min(1, nx));
      gaze.current.y = Math.max(-1, Math.min(1, ny));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // reduced motion: draw one friendly static frame
  useEffect(() => {
    if (cap.ready && cap.reducedMotion) {
      const ctx = setup();
      if (ctx)
        drawCat(ctx, {
          eye: "happy",
          mouth: "happy",
          gx: 0,
          gy: 0,
          tail: 0,
          hop: 0,
          ear: 0,
          sleep: false,
          t: 0,
        });
    }
  }, [cap.ready, cap.reducedMotion]);

  useEffect(() => {
    if (!inView || (cap.ready && cap.reducedMotion)) return;
    const ctx = setup();
    if (!ctx) return;
    let raf = 0;
    let lastTick = 0;
    const start = performance.now();
    lastActivity.current = start;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - lastTick < 55) return; // ~18fps
      lastTick = now;
      const t = now - start;

      const petting = now < happyUntil.current;
      const meowing = now < meowUntil.current;
      const sleeping = !petting && !meowing && now - lastActivity.current > 7000;

      if (!sleeping && t > nextBlink.current && now > blinkUntil.current) {
        blinkUntil.current = now + 130;
        nextBlink.current = t + 2200 + Math.random() * 4000;
      }
      const blinking = !sleeping && now < blinkUntil.current;

      if (!sleeping && t > nextTwitch.current && now > earTwitchUntil.current) {
        earTwitchUntil.current = now + 160;
        nextTwitch.current = t + 3000 + Math.random() * 4000;
      }

      // idle look-around — when the pointer is still, Ace glances about
      if (!sleeping && !petting && now - lastActivity.current > 1600 && t > nextLook.current) {
        gaze.current.x = (Math.random() * 2 - 1) * 0.8;
        gaze.current.y = Math.random() * 0.5;
        nextLook.current = t + 1100 + Math.random() * 2200;
      }

      const eye: St["eye"] = meowing
        ? "wide"
        : blinking
        ? "blink"
        : sleeping
        ? "sleep"
        : petting
        ? "happy"
        : "open";
      const mouth: St["mouth"] = meowing ? "meow" : petting ? "happy" : "neutral";

      const hop = petting ? Math.abs(Math.sin(now * 0.012)) * 4 : 0;
      const tailSpeed = petting ? 0.012 : sleeping ? 0.003 : 0.006;

      drawCat(ctx, {
        eye,
        mouth,
        gx: sleeping || blinking ? 0 : Math.round(gaze.current.x),
        gy: sleeping || blinking ? 0 : Math.round(Math.max(0, gaze.current.y)),
        tail: now * tailSpeed,
        hop,
        ear: now < earTwitchUntil.current ? -2 : 0,
        sleep: sleeping,
        t,
      });

      // hearts
      const hs = hearts.current;
      for (let i = hs.length - 1; i >= 0; i--) {
        const h = hs[i];
        h.y -= 0.4;
        h.life -= 1;
        if (h.life <= 0) hs.splice(i, 1);
        else {
          ctx.globalAlpha = Math.min(1, h.life / 18);
          drawHeart(ctx, h.x, h.y, h.c);
          ctx.globalAlpha = 1;
        }
      }

      const nextMood = sleeping ? "sleep" : petting ? "happy" : "idle";
      if (nextMood !== moodRef.current) {
        moodRef.current = nextMood;
        setMood(nextMood);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView, cap.ready, cap.reducedMotion]);

  const spawnHearts = (n: number) => {
    for (let i = 0; i < n; i++)
      hearts.current.push({
        x: CX - 8 + Math.random() * 16,
        y: 14 + Math.random() * 6,
        life: 34 + Math.random() * 14,
        c: Math.random() > 0.5 ? P.BOW : P.PINK,
      });
  };
  const pet = () => {
    const now = performance.now();
    happyUntil.current = now + 1500;
    lastActivity.current = now;
    if (now > meowUntil.current + 1200) {
      spawnHearts(1);
      audio.play("hover");
    }
  };
  const meow = () => {
    const now = performance.now();
    meowUntil.current = now + 650;
    happyUntil.current = now + 1700;
    lastActivity.current = now;
    spawnHearts(3);
    audio.play("select");
  };

  // react to outside events (e.g. Ace answering in the chat)
  useEffect(() => {
    const onReact = (e: Event) => {
      const kind = (e as CustomEvent).detail;
      if (kind === "meow") meow();
      else pet();
    };
    window.addEventListener("ace:react", onReact as EventListener);
    return () => window.removeEventListener("ace:react", onReact as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={viewRef} className="flex flex-col items-center">
      <div
        ref={wrapRef}
        onPointerEnter={pet}
        onPointerMove={pet}
        onClick={meow}
        data-cursor={mood === "sleep" ? "wake me" : "pet me"}
        className="cat-frame relative cursor-pointer select-none overflow-hidden rounded-2xl border border-[var(--color-line)] p-6 sm:p-8"
        style={{ background: "radial-gradient(120% 120% at 50% 22%, #12100c, #050605)" }}
      >
        {/* warm overhead spotlight pool the cat sits in */}
        <span
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
            mood === "sleep" ? "opacity-40" : "opacity-100"
          }`}
          style={{
            background:
              "radial-gradient(60% 50% at 50% 8%, rgba(255,200,140,0.18), transparent 65%)",
          }}
        />
        {/* soft ground shadow / pedestal */}
        <span
          className="pointer-events-none absolute bottom-4 left-1/2 h-3 w-2/3 -translate-x-1/2 rounded-[50%]"
          style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.55), transparent)" }}
        />
        <canvas
          ref={canvasRef}
          className={`relative block h-auto max-w-full ${
            mood === "sleep" ? "" : "cat-bob"
          }`}
          style={{ imageRendering: "pixelated" }}
        />
        {/* brass corner ticks — a tiny framed-portrait flourish */}
        {[
          "left-2 top-2 border-l border-t",
          "right-2 top-2 border-r border-t",
          "bottom-2 left-2 border-b border-l",
          "bottom-2 right-2 border-b border-r",
        ].map((c) => (
          <span
            key={c}
            className={`pointer-events-none absolute h-3 w-3 border-[var(--color-brass)]/40 ${c}`}
          />
        ))}
      </div>

      {/* nameplate */}
      <span className="font-display mt-4 rounded-full border border-[var(--color-line-warm)] bg-[var(--color-noir-2)]/60 px-4 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--color-brass)]">
        Ace · the house cat ♠
      </span>

      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
        {mood === "happy"
          ? "purrrr~"
          : mood === "sleep"
          ? "shhh, napping"
          : "pet the cat · click for a meow"}
      </p>
    </div>
  );
}
