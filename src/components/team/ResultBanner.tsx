"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";

export function ResultBanner({
  shortlisted,
  teamName,
  slot,
}: {
  shortlisted: boolean;
  teamName: string;
  slot: { start: string; end: string; session: string } | null;
}) {
  useEffect(() => {
    if (!shortlisted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const key = `pat-confetti-${teamName}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    const colors = ["#1f6bff", "#4a90ff", "#ecebe4", "#ffffff"];
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.3 }, colors });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors }), 250);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors }), 400);
  }, [shortlisted, teamName]);

  if (shortlisted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-blue bg-[linear-gradient(135deg,#1f6bff,#0b3fae)] p-7 sm:p-10"
      >
        <span className="brush pointer-events-none absolute -right-4 -bottom-10 text-[10rem] leading-none text-white/10" aria-hidden>
          ✓
        </span>
        <p className="font-display text-xs font-extrabold uppercase tracking-[0.35em] text-white/80">PPT round results</p>
        <h2 className="brush mt-3 text-5xl text-white sm:text-7xl">You&apos;re shortlisted!</h2>
        <p className="mt-3 max-w-xl text-white/85">
          Congratulations, {teamName}. Your PPT made the cut. See you on the 29th at the Seminar Hall. Bring your slides and your A-game.
        </p>
        {slot ? (
          <div className="mt-6 inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-black/25 px-5 py-3">
            <span className="font-display text-xs font-bold uppercase tracking-[0.25em] text-white/70">Your slot</span>
            <span className="font-display text-2xl font-black text-white">
              {slot.start} to {slot.end}
            </span>
            <span className="text-sm text-white/70">{slot.session}</span>
          </div>
        ) : (
          <p className="mt-6 text-sm text-white/75">Your presentation slot will be announced soon.</p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-line bg-ink-2 p-7 sm:p-10"
    >
      <p className="font-display text-xs font-extrabold uppercase tracking-[0.35em] text-muted">PPT round results</p>
      <h2 className="brush mt-3 text-4xl sm:text-6xl">Better luck next time!</h2>
      <p className="mt-3 max-w-xl text-paper/75">
        {teamName} wasn&apos;t shortlisted in the PPT round this time, but shaping a research idea is already a win most
        people never attempt. Keep refining it, come cheer the finalists on the 29th, and bring it back stronger next time.
      </p>
      <p className="hand mt-4 text-3xl">Read · Analyse · Think · Write · Repeat</p>
    </motion.div>
  );
}
