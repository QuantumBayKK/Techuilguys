"use client";

import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";

/**
 * Reborn ambience — the whole room's light changes as you move through it. A
 * fixed backdrop of four mood gradients that crossfade across the scroll:
 * lamp-lit noir (hero) → felt green (the deck) → warm amber (the dealers) →
 * smoky ember close. Sits behind everything; honors reduced-motion (CSS holds
 * it on the first mood).
 */
const MOODS = [
  // hero — warm key light from above on near-black
  "radial-gradient(90% 60% at 50% -8%, rgba(255,176,90,0.18), transparent 60%), linear-gradient(180deg, #0a0907, #0a0907)",
  // the deck — casino felt seeping up
  "radial-gradient(80% 70% at 30% 30%, rgba(15,61,46,0.5), transparent 65%), radial-gradient(70% 60% at 80% 70%, rgba(255,157,47,0.08), transparent 60%), linear-gradient(180deg, #08100c, #0a0907)",
  // the dealers — amber spotlight wash
  "radial-gradient(75% 65% at 50% 35%, rgba(255,157,47,0.16), transparent 60%), radial-gradient(60% 60% at 20% 80%, rgba(201,162,75,0.12), transparent 60%), linear-gradient(180deg, #120c07, #0a0907)",
  // the close — smoky embers, teal shadow
  "radial-gradient(90% 70% at 50% 110%, rgba(255,176,90,0.16), transparent 60%), radial-gradient(60% 50% at 50% 0%, rgba(55,230,207,0.05), transparent 60%), linear-gradient(180deg, #0a0907, #060808)",
];

function Layer({
  progress,
  image,
  stops,
}: {
  progress: MotionValue<number>;
  image: string;
  stops: [number, number, number, number];
}) {
  const opacity = useTransform(progress, stops, [0, 1, 1, 0]);
  return (
    <motion.span
      className="absolute inset-0"
      style={{ opacity, backgroundImage: image }}
    />
  );
}

export default function AmbientBackdrop() {
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 50, damping: 26, mass: 0.7 });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[var(--color-noir)]">
      {/* reduced-motion: a single static mood (first layer) shows via CSS */}
      <span
        className="absolute inset-0 hidden motion-reduce:block"
        style={{ backgroundImage: MOODS[0] }}
      />
      <div className="absolute inset-0 motion-reduce:hidden">
        <Layer progress={p} image={MOODS[0]} stops={[0, 0.05, 0.22, 0.34]} />
        <Layer progress={p} image={MOODS[1]} stops={[0.24, 0.36, 0.5, 0.6]} />
        <Layer progress={p} image={MOODS[2]} stops={[0.52, 0.62, 0.74, 0.84]} />
        <Layer progress={p} image={MOODS[3]} stops={[0.76, 0.86, 1, 1]} />
      </div>
    </div>
  );
}
