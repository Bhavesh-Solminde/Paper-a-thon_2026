"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const WORDS = ["Read", "Analyse", "Think", "Write", "Repeat", "Present", "Publish"];

/** Two tilted tapes that scroll in opposite directions and skew with scroll velocity. */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tapes = gsap.utils.toArray<HTMLElement>(".tape-track");
      const tweens = tapes.map((el, i) =>
        gsap.to(el, { xPercent: i % 2 ? 50 : -50, ease: "none", duration: 30, repeat: -1 }),
      );
      tapes.forEach((el, i) => i % 2 && gsap.set(el, { xPercent: -50 }));
      const skew = gsap.quickTo(".tape", "skewX", { duration: 0.4, ease: "power3" });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = self.getVelocity();
          skew(gsap.utils.clamp(-8, 8, v / -300));
          tweens.forEach((t) => t.timeScale(1 + Math.min(Math.abs(v) / 400, 4)));
        },
      });
    },
    { scope: root },
  );

  const row = (
    <>
      {[...WORDS, ...WORDS].map((w, i) => (
        <span key={i} className="flex items-center gap-8 pr-8">
          <span>{w}</span>
          <span className="text-blue">✦</span>
        </span>
      ))}
    </>
  );

  return (
    <div ref={root} className="relative overflow-hidden py-16 sm:py-24" aria-hidden>
      <div className="tape -rotate-2 bg-blue py-3 sm:py-4">
        <div className="tape-track flex w-max font-display text-2xl font-black uppercase tracking-wide text-white sm:text-4xl [&_.text-blue]:text-ink">
          {row}
          {row}
        </div>
      </div>
      <div className="tape paper mt-6 rotate-1 py-3 sm:py-4">
        <div className="tape-track brush flex w-max text-2xl uppercase sm:text-4xl">
          {row}
          {row}
        </div>
      </div>
    </div>
  );
}
