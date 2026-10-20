"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FAQ } from "@/content/site-copy";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="space-y-2">
      {FAQ.map((item, i) => {
        const isOpen = open === i;
        const id = `faq-${i}`;
        return (
          <li
            key={item.q}
            className={`rounded-[18px] border transition-colors ${isOpen ? "border-white/15 bg-night-3" : "border-white/8 bg-night-2"}`}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left text-[0.95rem] font-medium text-white"
              >
                {item.q}
                <ChevronDown
                  aria-hidden
                  size={18}
                  className={`shrink-0 text-white/60 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl px-5 pb-5 text-sm leading-relaxed text-mist">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
