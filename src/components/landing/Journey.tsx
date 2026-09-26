"use client";

import { useRef } from "react";
import { useNow } from "@/lib/useNow";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PHASES } from "@/lib/event";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** "Road to the 29th" — pinned horizontal scroll on desktop, stacked cards on mobile. */
export function Journey() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const now = useNow(60_000);
  let current = -1;
  if (now !== null) {
    current = 0;
    PHASES.forEach((p, i) => {
      if (new Date(p.at).getTime() <= now) current = i;
    });
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth + 48;
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        gsap.fromTo(
          ".journey-progress",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true },
          },
        );
      });
      mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".journey-card").forEach((card) =>
          gsap.from(card, { x: -40, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 85%" } }),
        );
      });
    },
    { scope: root },
  );

  return (
    <section id="journey" ref={root} className="relative overflow-hidden py-24 md:flex md:h-dvh md:flex-col md:justify-center md:py-0">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <p className="eyebrow">The journey</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-4xl font-black uppercase leading-[0.95] sm:text-6xl">
            Road to the <span className="brush text-blue-bright normal-case">29th</span>
          </h2>
          <p className="hand text-2xl sm:text-3xl">scroll → it&apos;s a marathon</p>
        </div>
        <div className="relative mt-8 hidden h-0.5 w-full bg-line md:block">
          <div className="journey-progress absolute inset-0 origin-left bg-blue" />
        </div>
      </div>

      <div
        ref={track}
        className="mt-10 flex flex-col gap-5 px-4 sm:px-6 md:mt-14 md:w-max md:flex-row md:gap-6 md:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]"
      >
        {PHASES.map((p, i) => {
          const state = current < 0 ? "upcoming" : i < current ? "done" : i === current ? "current" : "upcoming";
          return (
            <article
              key={p.key}
              className={`journey-card relative flex flex-col justify-between overflow-hidden rounded-3xl border p-7 transition-colors md:min-h-[22rem] md:w-[min(26rem,34vw)] ${
                state === "current"
                  ? "border-blue bg-blue/10 shadow-[0_0_80px_-20px_rgb(31_107_255/0.7)]"
                  : "border-line bg-ink-2"
              }`}
            >
              <span className="brush pointer-events-none absolute -right-2 -top-6 text-[9rem] leading-none text-white/[0.04]" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full font-display text-sm font-black ${
                      state === "done" ? "bg-paper text-ink" : state === "current" ? "bg-blue text-white animate-pulse-dot" : "border border-line text-muted"
                    }`}
                  >
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  <span className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">
                    {state === "current" ? <span className="text-blue-bright">You are here</span> : state === "done" ? "Done" : "Up next"}
                  </span>
                </div>
                <h3 className="mt-8 font-display text-3xl font-black uppercase leading-none sm:text-4xl">{p.title}</h3>
                <p className="hand mt-2 text-2xl">{p.date}</p>
              </div>
              <p className="mt-6 text-paper/70">{p.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
