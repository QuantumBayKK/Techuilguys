"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { handFor } from "@/data/projects";
import { CardFront } from "@/components/cards/CardFaces";
import { experience, useExperience } from "@/lib/experience";
import { audio } from "@/lib/audio";
import InspectCard from "./InspectCard";

const FAN = [-2, -1, 0, 1, 2]; // five positions around center

/**
 * The deal + the fanned hand. Five cards fly in from the dealer (top-center),
 * settle into an arced fan in POV, and lift to artifact-inspection on click.
 */
export default function Hand() {
  const { stage, dealer, inspectId } = useExperience();
  const show = (stage === "dealt" || stage === "inspect") && dealer;
  const cards = dealer ? handFor(dealer) : [];
  const [hovered, setHovered] = useState<string | null>(null);

  // staggered deal SFX
  useEffect(() => {
    if (stage !== "dealt") return;
    const timers = cards.map((_, i) =>
      setTimeout(() => {
        audio.play("deal", { rate: 1 });
      }, 250 + i * 130)
    );
    return () => timers.forEach(clearTimeout);
  }, [stage, dealer]);

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.section
            key="hand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: stage === "inspect" ? 0 : 0.7,
                y: 0,
              }}
              transition={{ delay: 1 }}
              className="font-display absolute top-[12%] text-xs uppercase tracking-[0.5em] text-[var(--color-brass)]"
            >
              Your hand · {cards.length} cards · tap to inspect
            </motion.p>

            <div
              className="relative mb-[6vh] h-[46vh] w-full max-w-3xl"
              style={{ perspective: 1400 }}
            >
              {cards.map((p, i) => {
                const slot = FAN[i] ?? 0;
                const dim = stage === "inspect" && inspectId !== p.id;
                const hidden = stage === "inspect" && inspectId === p.id;
                const isHover = stage === "dealt" && hovered === p.id;
                return (
                  <motion.button
                    key={`${dealer}-${p.id}`}
                    data-cursor="Lift"
                    aria-label={`Inspect ${p.title}`}
                    onHoverStart={() => {
                      if (stage === "dealt") {
                        setHovered(p.id);
                        audio.play("hover");
                      }
                    }}
                    onHoverEnd={() => setHovered((h) => (h === p.id ? null : h))}
                    onClick={() => {
                      audio.play("flip");
                      experience.set({ stage: "inspect", inspectId: p.id });
                    }}
                    className="pointer-events-auto absolute left-1/2 top-1/2 h-[40vh] max-h-[420px] w-[28vh] max-w-[300px] origin-bottom"
                    style={{
                      marginLeft: "-14vh",
                      marginTop: "-22vh",
                      zIndex: isHover ? 50 : 10 + i,
                    }}
                    initial={{ x: 0, y: -520, rotate: slot * 4 - 30, opacity: 0 }}
                    animate={{
                      x: slot * (isHover ? 104 : 92),
                      y: Math.abs(slot) * 26 + (dim ? 40 : 0) - (isHover ? 60 : 0),
                      rotate: isHover ? 0 : slot * 7,
                      scale: isHover ? 1.12 : 1,
                      opacity: hidden ? 0 : dim ? 0.35 : 1,
                      filter: dim
                        ? "blur(3px) brightness(0.7)"
                        : isHover
                        ? "brightness(1.12)"
                        : "blur(0px)",
                    }}
                    transition={{
                      delay: stage === "dealt" && hovered === null ? 0.25 + i * 0.13 : 0,
                      type: "spring",
                      stiffness: isHover ? 260 : 90,
                      damping: isHover ? 20 : 15,
                    }}
                  >
                    <div
                      className="h-full w-full transition-[filter] duration-300"
                      style={{
                        filter: isHover
                          ? "drop-shadow(0 30px 55px rgba(0,0,0,0.7)) drop-shadow(0 0 28px rgba(255,157,47,0.45))"
                          : "drop-shadow(0 20px 40px rgba(0,0,0,0.6))",
                      }}
                    >
                      <CardFront project={p} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <InspectCard />
    </>
  );
}
