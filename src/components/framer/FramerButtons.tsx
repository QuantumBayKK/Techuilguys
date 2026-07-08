"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Ports of three free Framer button components, re-skinned to the saloon
 * palette (tokens only, no raw hex):
 *
 * — OriginButton: a circle inflates from the exact point the cursor entered
 *   (spring 85/18, faithful to the original) and floods the button; content
 *   sits above and can flip color via `group-hover:` classes.
 * — GlassyButton: metallic glass gradient rim + recessed inner face, layered
 *   shadows, springy press (bounce 0.1 / 0.4s). Styles live in globals.css
 *   (.glassy-btn / .glassy-btn__inner).
 * — NeuButton: dark neumorphism — dual outer shadows at rest that invert to
 *   inset "pressed-in" on hover (0.4s cubic-bezier(0.6,0,0.4,1)); styles in
 *   globals.css (.neu-btn).
 */

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode;
  className?: string;
};

export function OriginButton({
  children,
  className,
  circleClassName = "bg-[var(--color-noir)]",
  ...rest
}: AnchorProps & { circleClassName?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [circle, setCircle] = useState({ x: 0, y: 0, d: 0 });
  const [hovered, setHovered] = useState(false);

  const place = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setCircle({
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      d: Math.max(r.width, r.height) * 2,
    });
  };

  return (
    <a
      ref={ref}
      {...rest}
      onMouseEnter={(e) => {
        place(e);
        setHovered(true);
        rest.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        place(e);
        setHovered(false);
        rest.onMouseLeave?.(e);
      }}
      className={`group relative isolate overflow-hidden ${className ?? ""}`}
    >
      <motion.span
        aria-hidden
        className={`pointer-events-none absolute -z-[1] rounded-full ${circleClassName}`}
        style={{
          left: circle.x,
          top: circle.y,
          width: circle.d,
          height: circle.d,
          translateX: "-50%",
          translateY: "-50%",
        }}
        initial={false}
        animate={{ scale: hovered ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 85, damping: 18, restDelta: 0.001 }}
      />
      {children}
    </a>
  );
}

export function GlassyButton({ children, className, ...rest }: AnchorProps) {
  return (
    <motion.a
      {...(rest as React.ComponentProps<typeof motion.a>)}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
      className={`glassy-btn inline-flex ${className ?? ""}`}
    >
      <span className="glassy-btn__inner inline-flex w-full items-center justify-center gap-2">
        {children}
      </span>
    </motion.a>
  );
}

export function NeuButton({ children, className, ...rest }: AnchorProps) {
  return (
    <a {...rest} className={`neu-btn inline-flex items-center justify-center gap-2 ${className ?? ""}`}>
      {children}
    </a>
  );
}
