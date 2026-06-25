"use client";

import { useEffect, useRef, useState } from "react";
import { DitheringShader, type DitheringShape, type DitheringType } from "@/components/ui/dithering-shader";
import { useCapability } from "@/lib/useCapability";

/**
 * Full-bleed ambient dithering shader, reskinned to the saloon palette and
 * sized to whatever it's dropped into. The raw 21st.dev shader renders at a
 * fixed pixel size; this measures the host box and feeds it real dimensions,
 * caps the pixel ratio on low-power devices, and bows out entirely under
 * reduced-motion / no-WebGL2 so the static noir background shows instead.
 *
 * Mount it as the first child of a `relative` section and put content above it.
 */
export default function ShaderBackdrop({
  shape = "ripple",
  type = "8x8",
  colorBack = "#0a0907",
  colorFront = "#16110b",
  pxSize = 3,
  speed = 0.35,
  opacity = 0.6,
  className = "",
}: {
  shape?: DitheringShape;
  type?: DitheringType;
  colorBack?: string;
  colorFront?: string;
  pxSize?: number;
  speed?: number;
  opacity?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cap = useCapability();
  const [webgl2, setWebgl2] = useState(true);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl2(!!c.getContext("webgl2"));
    } catch {
      setWebgl2(false);
    }
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const r = host.getBoundingClientRect();
      // Cap resolution on low-power devices — the shader is purely decorative.
      const scale = cap.lowPower ? 0.5 : 0.75;
      setSize({
        w: Math.max(1, Math.round(r.width * scale)),
        h: Math.max(1, Math.round(r.height * scale)),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [cap.lowPower]);

  // Decorative only — skip the WebGL pass on phones / few-core machines and
  // under reduced-motion, leaving the static felt background in place.
  const active =
    cap.ready && webgl2 && !cap.reducedMotion && !cap.lowPower && size.w > 0;

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      {active && (
        <DitheringShader
          width={size.w}
          height={size.h}
          shape={shape}
          type={type}
          colorBack={colorBack}
          colorFront={colorFront}
          pxSize={cap.lowPower ? pxSize + 1 : pxSize}
          speed={speed}
          style={{ width: "100%", height: "100%" }}
        />
      )}
      {/* vignette so the dithering melts into the felt at the edges */}
      <span
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, transparent 40%, var(--color-noir) 100%)",
        }}
      />
    </div>
  );
}
