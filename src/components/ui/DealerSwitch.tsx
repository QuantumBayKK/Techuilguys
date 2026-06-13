"use client";

import { motion } from "framer-motion";
import { DEALERS } from "@/data/dealers";
import { experience, useExperience } from "@/lib/experience";
import { audio } from "@/lib/audio";

/**
 * Once you've been dealt in, freely toggle between both dealers' hands — or
 * step back to the poster pick. Persistent while at the table.
 */
export default function DealerSwitch() {
  const { stage, dealer } = useExperience();
  if (stage !== "dealt" && stage !== "inspect") return null;

  const swap = (id: (typeof DEALERS)[number]["id"]) => {
    if (id === dealer) return;
    audio.play("select");
    experience.set({ dealer: id, stage: "dealt", inspectId: null });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="fixed left-1/2 top-[5.5rem] z-[78] flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-noir-2)]/70 p-1 backdrop-blur"
    >
      {DEALERS.map((d) => {
        const active = d.id === dealer;
        return (
          <button
            key={d.id}
            data-cursor="Deal"
            data-magnetic
            onClick={() => swap(d.id)}
            className="relative rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors"
            style={{ color: active ? "var(--color-noir)" : "var(--color-muted)" }}
          >
            {active && (
              <motion.span
                layoutId="dealer-pill"
                className="absolute inset-0 rounded-full bg-[var(--color-neon-amber)]"
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              />
            )}
            <span className="relative font-display font-bold">
              {d.name} {d.id === "kailosh" ? "♠" : "♣"}
            </span>
          </button>
        );
      })}
      <button
        data-cursor="Back"
        data-magnetic
        onClick={() => {
          audio.play("hover");
          experience.set({ stage: "dealers", dealer: null, inspectId: null });
        }}
        className="font-display ml-1 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-neon-amber)]"
      >
        Posters
      </button>
    </motion.div>
  );
}
