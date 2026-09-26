"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FAQ } from "@/lib/event";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-24 sm:px-6 md:py-32">
      <p className="eyebrow">FAQ</p>
      <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] sm:text-6xl">
        Questions? <span className="hand normal-case">we got you</span>
      </h2>
      <ul className="mt-12 divide-y divide-line border-y border-line">
        {FAQ.map((f, i) => {
          const isOpen = open === i;
          return (
            <li key={f.q}>
              <button
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="font-display text-lg font-extrabold uppercase sm:text-xl">{f.q}</span>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-xl transition-transform duration-300 ${isOpen ? "rotate-45 border-blue bg-blue" : ""}`}>
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-6 text-paper/70">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
