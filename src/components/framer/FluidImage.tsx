"use client";

import { useEffect, useRef } from "react";

/**
 * Port of Framer's "FluidImage": a WebGL layer over the image that warps it
 * with a swirling, velocity-driven flow field following the cursor. The
 * original keeps a decaying pointer trail (persistence 0.97/frame, smoothing
 * 0.08, radius 0.4, strength 0.9, DPR cap 1.75) — we mirror those numbers with
 * a fixed-size trail of swirl impulses summed in the fragment shader, plus a
 * pointer-down burst and a whisper of chromatic split. The <img> underneath is
 * the SSR/fallback render; touch, reduced-motion and no-WebGL all keep it.
 * The rAF loop only runs while the trail is alive, so idle cost is zero.
 */
const TRAIL = 14;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uCover;              // shown fraction of the texture (cover fit)
uniform vec2 uPts[${TRAIL}];      // trail points, uv space
uniform vec4 uMeta[${TRAIL}];     // life, vx, vy, burst
uniform float uRadius;
uniform float uStrength;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 disp = vec2(0.0);
  for (int i = 0; i < ${TRAIL}; i++) {
    float life = uMeta[i].x;
    if (life <= 0.001) continue;
    vec2 d = uv - uPts[i];
    float fall = exp(-dot(d, d) / (uRadius * uRadius * 0.08));
    vec2 swirl = vec2(-d.y, d.x) * 1.4;           // curl around the point
    vec2 push = uMeta[i].yz * 0.6;                 // velocity drag
    float ring = uMeta[i].w * sin(life * 9.0);     // pointer-down burst wave
    disp += (swirl + push + normalize(d + 1e-4) * ring) * fall * life;
  }
  disp *= uStrength * 0.05;
  vec2 base = 0.5 + (uv - 0.5) * uCover;
  vec3 col;
  col.r = texture2D(uTex, base - disp * 1.06).r;   // slight chromatic split
  col.g = texture2D(uTex, base - disp).g;
  col.b = texture2D(uTex, base - disp * 0.94).b;
  float energy = clamp(length(disp) * 26.0, 0.0, 1.0);
  col += vec3(1.0, 0.62, 0.18) * energy * 0.10;    // warm sheen where it flows
  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export default function FluidImage({
  src,
  alt,
  className,
  imgClassName,
  radius = 0.4,
  strength = 0.9,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  radius?: number;
  strength?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    )
      return;

    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) return;

    // program
    const mk = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uPts = gl.getUniformLocation(prog, "uPts");
    const uMeta = gl.getUniformLocation(prog, "uMeta");
    const uCover = gl.getUniformLocation(prog, "uCover");
    gl.uniform1f(gl.getUniformLocation(prog, "uRadius"), radius);
    gl.uniform1f(gl.getUniformLocation(prog, "uStrength"), strength);

    // texture from the image
    let texReady = false;
    let imgW = 1, imgH = 1;
    const tex = gl.createTexture();
    const img = new Image();
    img.src = src;
    img.decode?.().catch(() => {});
    img.onload = () => {
      imgW = img.naturalWidth;
      imgH = img.naturalHeight;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      texReady = true;
      size();
    };

    const size = () => {
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      const r = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      // object-fit: cover mapping
      const scale = Math.max(r.width / imgW, r.height / imgH) || 1;
      gl.uniform2f(uCover, r.width / (imgW * scale), r.height / (imgH * scale));
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap);

    // pointer trail
    const pts = new Float32Array(TRAIL * 2);
    const meta = new Float32Array(TRAIL * 4);
    let head = 0;
    let sx = 0.5, sy = 0.5;          // smoothed pointer (blend 0.08)
    let lx = 0.5, ly = 0.5;
    let raf = 0;
    let running = false;
    let last = 0;

    const frame = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.7 || 1);
      last = now;
      let alive = false;
      for (let i = 0; i < TRAIL; i++) {
        meta[i * 4] *= Math.pow(0.97, dt * 2.2); // persistence
        meta[i * 4 + 3] *= Math.pow(0.94, dt * 2.2);
        if (meta[i * 4] > 0.01) alive = true;
      }
      if (texReady) {
        gl.uniform2fv(uPts, pts);
        gl.uniform4fv(uMeta, meta);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      canvas.style.opacity = alive ? "1" : "0";
      if (alive) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const wake = () => {
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const push = (x: number, y: number, burst = 0) => {
      sx += (x - sx) * (burst ? 1 : 0.6);
      sy += (y - sy) * (burst ? 1 : 0.6);
      const vx = sx - lx, vy = sy - ly;
      lx = sx; ly = sy;
      pts[head * 2] = sx;
      pts[head * 2 + 1] = sy;
      meta[head * 4] = 1;
      meta[head * 4 + 1] = Math.max(-1, Math.min(1, vx * 14));
      meta[head * 4 + 2] = Math.max(-1, Math.min(1, vy * 14));
      meta[head * 4 + 3] = burst;
      head = (head + 1) % TRAIL;
      wake();
    };

    const toUv = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] as const;
    };
    const onMove = (e: PointerEvent) => push(...toUv(e));
    const onDown = (e: PointerEvent) => push(...toUv(e), 0.9);

    wrap.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerdown", onDown);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [src, radius, strength]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`absolute inset-0 h-full w-full object-cover ${imgClassName ?? ""}`} />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
