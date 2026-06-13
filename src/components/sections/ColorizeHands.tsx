"use client";

import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { useCapability } from "@/lib/useCapability";

/**
 * The Luke-Baffait contact reach, our way: a shaded scene of two hands reaching
 * for a dealt card (Creation-of-Adam framing) plus "DEAL US IN" is rendered to
 * an offscreen canvas, then converted to dense high-res ASCII by luminance.
 * The art sits dim; the cursor paints an electric colour reveal through a
 * radial mask, drops a fading trail, and drags a warm light around. No photos,
 * no assets — real image→ASCII, like the reference.
 */

const COLS = 184;
const ROWS = 104;
// dark → light luminance ramp
const RAMP =
  " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@";

export default function ColorizeHands() {
  const wrap = useRef<HTMLDivElement>(null);
  const color = useRef<HTMLPreElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const cap = useCapability();
  const [art, setArt] = useState("");
  const lastBloom = useRef(0);
  const lastTrail = useRef(0);

  // Build the ASCII once on mount.
  useEffect(() => {
    setArt(buildAsciiHands());
  }, []);

  const onMove = (e: React.PointerEvent) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const lx = e.clientX - r.left;
    const ly = e.clientY - r.top;
    const x = (lx / r.width) * 100;
    const y = (ly / r.height) * 100;
    if (color.current) {
      color.current.style.setProperty("--mx", `${x}%`);
      color.current.style.setProperty("--my", `${y}%`);
      color.current.style.opacity = "1";
    }
    if (glow.current) {
      glow.current.style.left = `${x}%`;
      glow.current.style.top = `${y}%`;
      glow.current.style.opacity = "1";
    }
    if (e.timeStamp - lastTrail.current > 16) {
      lastTrail.current = e.timeStamp;
      spawnTrail(el, lx, ly);
    }
    if (e.timeStamp - lastBloom.current > 240) {
      audio.play("chip");
      lastBloom.current = e.timeStamp;
    }
  };
  const onLeave = () => {
    if (color.current) color.current.style.opacity = "0";
    if (glow.current) glow.current.style.opacity = "0";
  };

  const reduced = cap.reducedMotion;
  const preCls =
    "m-0 select-none whitespace-pre text-center font-mono leading-[0.92] text-[clamp(3px,0.86vw,8px)] tracking-[0.06em]";

  return (
    <div
      ref={wrap}
      onPointerMove={reduced ? undefined : onMove}
      onPointerLeave={reduced ? undefined : onLeave}
      data-cursor="Deal us in"
      className="relative mx-auto flex aspect-[16/9] w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-line)]"
      style={{ background: "radial-gradient(120% 120% at 50% 42%, #0c0f0e, #040504)" }}
    >
      {/* grayscale ASCII base */}
      <pre className={`pointer-events-none ${preCls} text-[#b3a585]`}>{art}</pre>

      {/* warm light following cursor */}
      <div
        ref={glow}
        className="pointer-events-none absolute h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 mix-blend-screen"
        style={{
          background:
            "radial-gradient(closest-side, rgba(55,230,207,0.16), transparent)",
        }}
      />

      {/* electric reveal masked to the cursor */}
      <pre
        ref={color}
        className={`pointer-events-none absolute inset-0 flex items-center justify-center ${preCls} font-bold text-[var(--color-electric)] opacity-0 transition-opacity duration-300`}
        style={{
          textShadow: "0 0 7px rgba(55,230,207,0.55)",
          ["--mx" as string]: "50%",
          ["--my" as string]: "50%",
          WebkitMaskImage: reduced
            ? "none"
            : "radial-gradient(circle 17% at var(--mx) var(--my), #000 0%, #000 42%, transparent 76%)",
          maskImage: reduced
            ? "none"
            : "radial-gradient(circle 17% at var(--mx) var(--my), #000 0%, #000 42%, transparent 76%)",
          opacity: reduced ? 1 : undefined,
        }}
      >
        {art}
      </pre>
    </div>
  );
}

/** Render the hand scene to a canvas, then sample it into an ASCII string. */
function buildAsciiHands(): string {
  if (typeof document === "undefined") return "";
  const W = COLS;
  const H = ROWS;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;

  // background
  x.fillStyle = "#000";
  x.fillRect(0, 0, W, H);

  // one large open hand reaching toward the viewer, then the title
  drawOpenHand(x, W, H);
  drawTitle(x, W, H);

  // sample to ASCII
  const data = x.getImageData(0, 0, W, H).data;
  const rows: string[] = [];
  for (let j = 0; j < H; j++) {
    let line = "";
    for (let i = 0; i < W; i++) {
      const p = (j * W + i) * 4;
      // perceptual luminance
      const l =
        (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
      const idx = Math.min(RAMP.length - 1, Math.max(0, Math.round(l * (RAMP.length - 1))));
      line += RAMP[idx];
    }
    rows.push(line.replace(/\s+$/, ""));
  }
  return rows.join("\n");
}

/**
 * One large open hand reaching up toward the viewer — palm, four spread
 * fingers, thumb, tapering forearm — shaded top-bright→bottom-dark so the
 * luminance ramp spreads across the full character set. Black gaps between
 * spread fingers define the silhouette.
 */
function drawOpenHand(x: CanvasRenderingContext2D, W: number, H: number) {
  const cx = W * 0.5;
  const palmY = H * 0.5;
  const u = W * 0.013;

  // light gradient applied to all skin shapes (fingertips bright, wrist dark)
  const skin = x.createLinearGradient(0, H * 0.12, 0, H * 0.92);
  skin.addColorStop(0, "#f3e9d2");
  skin.addColorStop(0.4, "#cdb79a");
  skin.addColorStop(0.7, "#8a7c64");
  skin.addColorStop(1, "#352f26");

  // wrist stub (kept short so the title sits clear below)
  x.fillStyle = skin;
  roundCap(x, cx, H * 0.74, cx, palmY + u * 4, u * 7);

  // palm
  x.beginPath();
  x.ellipse(cx, palmY, u * 9, u * 8.5, 0, 0, Math.PI * 2);
  x.fill();

  // fingers — angle (deg from vertical), length, width
  const fingers: [number, number, number][] = [
    [-34, 20, 2.3], // pinky
    [-12, 26, 2.6], // ring
    [8, 28, 2.7], // middle
    [27, 24, 2.5], // index
  ];
  for (const [deg, len, w] of fingers) {
    const a = (deg * Math.PI) / 180;
    const bx = cx + Math.sin(a) * u * 7;
    const by = palmY - Math.cos(a) * u * 7;
    const tx = cx + Math.sin(a) * u * (7 + len);
    const ty = palmY - Math.cos(a) * u * (7 + len);
    x.fillStyle = skin;
    roundCap(x, bx, by, tx, ty, u * w);
    // fingertip highlight
    x.fillStyle = "rgba(255,244,222,0.5)";
    ellipse(x, tx, ty, u * w * 0.8, u * w * 0.8);
  }

  // thumb (lower-left, angled out)
  const ta = (-72 * Math.PI) / 180;
  x.fillStyle = skin;
  roundCap(
    x,
    cx - u * 6,
    palmY + u * 2,
    cx - u * 6 + Math.sin(ta) * u * 16,
    palmY + u * 2 - Math.cos(ta) * u * 16,
    u * 3
  );

  // palm shading hollow for depth
  const hollow = x.createRadialGradient(cx, palmY + u, 0, cx, palmY + u, u * 7);
  hollow.addColorStop(0, "rgba(0,0,0,0.4)");
  hollow.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = hollow;
  ellipse(x, cx, palmY + u, u * 7, u * 6);

  // knuckle highlights
  x.fillStyle = "rgba(255,240,215,0.35)";
  for (let k = 0; k < 4; k++)
    ellipse(x, cx + (k - 1.5) * u * 3.4, palmY - u * 7, u * 1.4, u * 1.1);
}

function drawTitle(x: CanvasRenderingContext2D, W: number, H: number) {
  const g = x.createLinearGradient(0, H * 0.84, 0, H * 0.99);
  g.addColorStop(0, "#fff4dc");
  g.addColorStop(1, "#b59450");
  x.fillStyle = g;
  x.font = `bold ${Math.round(H * 0.15)}px Arial, sans-serif`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("DEAL US IN", W / 2, H * 0.91);
}

/* ---- tiny canvas helpers ---- */
function ellipse(x: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  x.fill();
}
function roundCap(
  x: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number
) {
  const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  x.beginPath();
  x.arc(x1, y1, r, a, a + Math.PI);
  x.arc(x2, y2, r, a + Math.PI, a + Math.PI * 2);
  x.closePath();
  x.fill();
}
/** Drop a single fading electric dot at (x,y) within the area. */
function spawnTrail(parent: HTMLElement, x: number, y: number) {
  const dot = document.createElement("span");
  dot.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:7px;height:7px;margin:-3.5px;border-radius:9999px;background:var(--color-electric);box-shadow:0 0 10px var(--color-electric);pointer-events:none;z-index:5;mix-blend-mode:screen;`;
  parent.appendChild(dot);
  dot
    .animate(
      [
        { opacity: 0.9, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.2)" },
      ],
      { duration: 520, easing: "ease-out" }
    )
    .addEventListener("finish", () => dot.remove());
}
