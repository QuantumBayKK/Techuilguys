"use client";

import { AnimatePresence, motion } from "framer-motion";
import EntryGate from "@/components/sections/EntryGate";
import DealerStage from "@/components/sections/DealerStage";
import Hand from "@/components/sections/Hand";
import Body from "@/components/sections/Body";
import Dialogue from "@/components/ui/Dialogue";
import DealerSwitch from "@/components/ui/DealerSwitch";
import { experience, useExperience } from "@/lib/experience";

export default function Home() {
  const { stage } = useExperience();

  const atTable =
    stage === "dealers" || stage === "dealt" || stage === "inspect";
  const cinematic = stage !== "gate" && stage !== "body";

  return (
    <main className="relative">
      {/* anamorphic letterbox during the cinematic stages */}
      <div
        className={`letterbox ${cinematic ? "letterbox-in" : ""}`}
        aria-hidden
      />
      {/* cigar-smoke haze over the table for the cinematic feel */}
      {stage !== "gate" && (
        <div
          className="pointer-events-none fixed inset-0 z-10 opacity-40 mix-blend-screen"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 30%, rgba(255,200,140,0.08), transparent 70%)",
          }}
        />
      )}

      {/* brand mark */}
      {stage !== "gate" && (
        <div className="font-display fixed left-5 top-5 z-[80] text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-ink)]">
          Techuila<span className="text-[var(--color-neon-amber)]">·</span>Guys
        </div>
      )}

      <EntryGate />
      <DealerStage />
      <DealerSwitch />
      <Hand />
      <Dialogue />

      {/* Skip the intro cinematic */}
      <AnimatePresence>
        {stage === "intro" && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            data-cursor="Skip"
            data-magnetic
            onClick={() => experience.set({ stage: "dealers" })}
            className="font-display fixed bottom-6 right-6 z-[80] text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted)] hover:text-[var(--color-neon-amber)]"
          >
            Skip intro →
          </motion.button>
        )}
      </AnimatePresence>

      {/* Enter the lounge (scroll handoff into the body) */}
      <AnimatePresence>
        {atTable && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: stage === "inspect" ? 0 : 0.85, y: 0 }}
            exit={{ opacity: 0 }}
            data-cursor="Enter"
            data-magnetic
            onClick={() => experience.set({ stage: "body" })}
            className="font-display fixed bottom-6 right-6 z-[80] rounded-full border border-[var(--color-line-warm)] px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)] hover:bg-[var(--color-neon-amber)]/10"
          >
            Enter the lounge ↓
          </motion.button>
        )}
      </AnimatePresence>

      {/* The scrollable site body */}
      {stage === "body" && <Body />}
    </main>
  );
}
