"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { TornPaper } from "@/components/ui/TornPaper";
import { Shield } from "@/components/ui/Shield";
import { Countdown } from "./Countdown";
import { EVENT } from "@/lib/event";
import { onIntroDone } from "@/lib/introBus";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Letters({ word }: { word: string }) {
  return (
    <>
      {word.split("").map((ch, i) => (
        <span key={i} className="hero-letter inline-block will-change-transform">
          {ch}
        </span>
      ))}
    </>
  );
}

function Slashes({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <g stroke="#1f6bff" strokeWidth="6" strokeLinecap="round" className="hero-slash">
        <path d="M12 6 22 22" />
        <path d="M30 4 32 20" />
        <path d="M46 10 38 24" />
      </g>
    </svg>
  );
}

export function Hero({ loggedIn }: { loggedIn: boolean }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" },
        (ctx) => {
          if (ctx.conditions?.reduce) return;

          // Built paused (the from-states apply immediately) and played once the entry animation tears away.
          const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
          tl.from(".hero-top > *", { y: 20, opacity: 0, stagger: 0.1, duration: 1 })
            .from(
              ".hero-strip",
              { scaleX: 0, rotate: (i) => [-8, 6, -5][i], transformOrigin: (i) => (i % 2 ? "right center" : "left center"), duration: 1.1, stagger: 0.12, ease: "power4.inOut" },
              0.1,
            )
            .from(".hero-letter", { yPercent: 120, rotate: () => gsap.utils.random(-25, 25), opacity: 0, duration: 1.2, stagger: 0.04 }, 0.55)
            .from(".hero-slash path", { scale: 0, opacity: 0, transformOrigin: "center", stagger: 0.08, duration: 0.6 }, 1.0)
            .from(".hero-scribble", { opacity: 0, x: (i) => (i % 2 ? 30 : -30), duration: 1, stagger: 0.1 }, 1.0)
            .from(".hero-bottom > *", { y: 30, opacity: 0, stagger: 0.1, duration: 1 }, 1.1);
          const off = onIntroDone(() => tl.play());

          // Scroll: the strips drift apart and the whole title recedes.
          gsap
            .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 } })
            .to(".hero-strip-0", { xPercent: -18, rotate: -6 }, 0)
            .to(".hero-strip-1", { xPercent: 20, rotate: 8 }, 0)
            .to(".hero-strip-2", { xPercent: -12, rotate: 5 }, 0)
            .to(".hero-title", { scale: 0.85, opacity: 0.25, yPercent: 20 }, 0)
            .to(".hero-glow", { scale: 1.6, opacity: 0 }, 0);
          return off;
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative flex min-h-dvh flex-col overflow-hidden pt-24 pb-10 md:pt-28">
      {/* ambient light + grid */}
      <div className="hero-glow pointer-events-none absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(31_107_255/0.28),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.03)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      {/* hand-written scribbles from the poster */}
      <p className="hero-scribble hand pointer-events-none absolute left-4 top-28 hidden -rotate-12 text-2xl leading-7 opacity-90 md:block lg:left-12 lg:text-3xl">
        Ideas
        <br />
        Research
        <br />
        Discussions
        <br />
        Impact
        <span className="mt-2 block h-1 w-28 rounded-full bg-blue" />
      </p>
      <p className="hero-scribble hand pointer-events-none absolute right-4 top-28 hidden -rotate-6 text-right text-3xl leading-8 md:block lg:right-12 lg:text-4xl">
        Learn
        <br />
        Build
        <br />
        Grow
        <br />
        Together
      </p>
      <p className="hero-scribble hand pointer-events-none absolute bottom-40 left-6 hidden rotate-[-8deg] text-2xl leading-7 lg:block">
        Read · Analyse
        <br />
        Think · Write
        <br />
        Repeat
      </p>
      <p className="hero-scribble hand pointer-events-none absolute bottom-40 right-8 hidden rotate-[-10deg] text-right text-2xl leading-7 lg:block">
        Better Research
        <br />
        Brighter Tomorrows
      </p>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 text-center sm:px-6">
        <div className="hero-top flex flex-col items-center gap-3">
          <p className="font-display text-xs font-extrabold tracking-[0.18em] sm:text-base">{EVENT.club.toUpperCase()}</p>
          <p className="font-display text-[0.65rem] font-semibold tracking-[0.8em] text-paper/70 sm:text-xs">PRESENTS</p>
          <Shield className="mt-2 h-24 w-[5.5rem] drop-shadow-[0_10px_30px_rgb(0_120_212/0.45)] sm:h-28 sm:w-[6.4rem]" />
        </div>

        <h1 className="hero-title relative my-8 flex w-full max-w-4xl flex-col items-center sm:my-10" aria-label="Paper-a-thon">
          <Slashes className="absolute -right-2 -top-10 h-14 w-14 sm:right-6 sm:h-20 sm:w-20" />
          <Slashes className="absolute -left-2 top-1/2 h-12 w-12 rotate-[200deg] sm:left-2 sm:h-16 sm:w-16" />

          <TornPaper seed={11} className="hero-strip hero-strip-0 relative z-10 -rotate-2 px-6 pt-4 pb-2 sm:px-10 shadow-2xl">
            <span className="brush block text-[clamp(4.6rem,22vw,11rem)]" aria-hidden>
              <Letters word="PAPER" />
            </span>
          </TornPaper>
          <TornPaper seed={29} depth={4} className="hero-strip hero-strip-1 relative z-20 -my-3 rotate-2 px-8 py-1 sm:-my-5">
            <span className="brush block text-[clamp(2.6rem,11vw,5.5rem)]" aria-hidden>
              <Letters word="-A-" />
            </span>
          </TornPaper>
          <TornPaper seed={43} className="hero-strip hero-strip-2 relative z-10 rotate-1 px-6 pt-4 pb-2 sm:px-10 shadow-2xl">
            <span className="brush block text-[clamp(4.6rem,22vw,11rem)]" aria-hidden>
              <Letters word="THON" />
            </span>
          </TornPaper>
        </h1>

        <div className="hero-bottom flex flex-col items-center gap-6">
          <div>
            <p className="font-display text-lg font-extrabold uppercase tracking-[0.08em] sm:text-2xl">
              {EVENT.tagline[0]}
              <br />
              {EVENT.tagline[1]}
            </p>
            <p className="mt-2 font-display text-xs font-extrabold uppercase tracking-[0.5em] text-blue-bright sm:text-sm">
              {EVENT.subTagline}
            </p>
          </div>

          <Countdown to={EVENT.eventStart} end={EVENT.eventEnd} />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={loggedIn ? "/dashboard" : "/login"} className="btn btn-primary">
              {loggedIn ? "Open dashboard" : "Team Login"} <span aria-hidden>→</span>
            </Link>
            <Link href="/shortlisted" className="btn btn-ghost">
              Shortlisted teams
            </Link>
          </div>

          <dl className="mt-2 grid w-full max-w-3xl grid-cols-1 gap-3 font-display text-sm font-extrabold uppercase sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line">
            <div className="flex items-center justify-center gap-2 text-blue-bright">
              <CalendarIcon /> <dt className="sr-only">Date</dt>
              <dd>{EVENT.dateLabel}</dd>
            </div>
            <div className="flex items-center justify-center gap-2 text-blue-bright">
              <ClockIcon /> <dt className="sr-only">Time</dt>
              <dd>{EVENT.timeLabel}</dd>
            </div>
            <div className="flex items-center justify-center gap-2 text-blue-bright">
              <PinIcon /> <dt className="sr-only">Venue</dt>
              <dd>{EVENT.venue}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

const iconProps = { width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}
export function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
export function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
