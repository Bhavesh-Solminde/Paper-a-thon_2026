"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Shield } from "@/components/ui/Shield";
import { TornPaper } from "@/components/ui/TornPaper";
import { markIntroDone } from "@/lib/introBus";

gsap.registerPlugin(useGSAP);

const SEEN_KEY = "pat-intro-seen";
const WORDS = ["Read", "Analyse", "Think", "Write", "Repeat"];

// A jagged horizontal tear across the screen (x, y in %), fixed so SSR and client agree.
const TEAR: [number, number][] = [
  [0, 49.2], [4, 51.1], [8, 48.6], [12, 50.8], [16, 47.9], [20, 51.6], [24, 49.4], [28, 52.2],
  [32, 48.8], [36, 50.4], [40, 47.6], [44, 51.3], [48, 49.1], [52, 52.4], [56, 48.3], [60, 50.9],
  [64, 47.8], [68, 51.8], [72, 49.6], [76, 52.1], [80, 48.4], [84, 50.6], [88, 47.7], [92, 51.4],
  [96, 49.3], [100, 50.7],
];

/**
 * Two torn halves as ONE clip-path polygon: the halves are joined by a zero-width
 * bridge along the left edge, so a single element can visibly split apart.
 * `g` = how far each half has moved (%), `t` = shear, giving a rotate-apart feel.
 */
function tornPolygon(g: number, t: number) {
  const top = (x: number) => -g - (x - 50) * t;
  const bot = (x: number) => g + (x - 50) * t;
  const p = (x: number, y: number) => `${x.toFixed(2)}% ${y.toFixed(2)}%`;
  const pts = [p(0, top(0)), p(100, top(100))];
  for (let i = TEAR.length - 1; i >= 0; i--) pts.push(p(TEAR[i][0], TEAR[i][1] + top(TEAR[i][0])));
  for (const [x, y] of TEAR) pts.push(p(x, y + bot(x)));
  pts.push(p(100, 100 + bot(100)), p(0, 100 + bot(0)));
  return `polygon(${pts.join(",")})`;
}

function tearPath(w: number, h: number) {
  return "M" + TEAR.map(([x, y]) => `${((x / 100) * w).toFixed(1)} ${((y / 100) * h).toFixed(1)}`).join(" L");
}

/**
 * Entry animation: badge → papers drop onto the desk → words flip → title is stamped →
 * a blue tear runs across the screen and the whole page rips open onto the site.
 * If a Higgsfield-generated clip exists (public/intro/*.mp4), it plays first and then tears away.
 */
export function Intro({ video }: { video?: { desktop?: string; mobile?: string; poster?: string } }) {
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gone, setGone] = useState(false);
  const skip = useRef<() => void>(() => {});

  useGSAP(
    () => {
      const html = document.documentElement;
      let seen = false;
      try {
        seen = !!sessionStorage.getItem(SEEN_KEY);
      } catch {}
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const finish = () => {
        html.classList.remove("intro-lock");
        window.__lenis?.start();
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {}
        setGone(true);
      };

      if (seen || reduce) {
        markIntroDone();
        finish();
        return;
      }

      html.classList.add("intro-lock");
      window.__lenis?.stop();

      const counter = { v: 0 };
      const counterEl = root.current!.querySelector<HTMLElement>(".intro-count");
      const tear = { g: 0, t: 0 };
      const setClip = () => {
        if (layer.current) layer.current.style.clipPath = tornPolygon(tear.g, tear.t);
      };

      // Tear line in pixel space so its stroke can be "drawn" continuously.
      const svg = root.current!.querySelector<SVGSVGElement>(".intro-tearline")!;
      const line = svg.querySelector("path")!;
      svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
      line.setAttribute("d", tearPath(window.innerWidth, window.innerHeight));
      const len = line.getTotalLength();
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });

      // The rip itself — shared by the paper intro and the video intro.
      const rip = gsap
        .timeline({ paused: true, onComplete: finish })
        .set(".intro-tearline", { opacity: 1 })
        .to(".intro-skip", { opacity: 0, duration: 0.2 }, 0)
        .to(line, { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut" }, 0)
        .to(".intro-shake", { x: () => gsap.utils.random(-6, 6), y: () => gsap.utils.random(-4, 4), duration: 0.05, repeat: 5, yoyo: true, ease: "none" }, "-=0.1")
        .add(() => markIntroDone())
        .to(tear, { g: 62, t: 0.09, duration: 1.1, ease: "expo.inOut", onUpdate: setClip }, "<")
        .to(".intro-tearline", { opacity: 0, duration: 0.3 }, "<0.15")
        .set(".intro-scraps", { opacity: 1 }, "<")
        .to(".intro-scraps span", { y: () => gsap.utils.random(-400, 400), x: () => gsap.utils.random(-300, 300), rotate: () => gsap.utils.random(-180, 180), opacity: 0, duration: 1.2, ease: "power3.out", stagger: 0.01 }, "<0.1");

      let master: gsap.core.Timeline | null = null;
      const vid = videoRef.current;

      if (vid) {
        // Higgsfield clip mode: play the clip, then rip.
        const go = () => rip.play();
        const timeout = setTimeout(go, 9000);
        vid.addEventListener("ended", () => {
          clearTimeout(timeout);
          go();
        }, { once: true });
        // No playable source (missing file / unsupported) → rip straight away.
        const probe = setTimeout(() => vid.readyState === 0 && (clearTimeout(timeout), go()), 2500);
        vid.play().catch(() => {
          clearTimeout(timeout);
          clearTimeout(probe);
          go();
        });
        gsap.to(counter, {
          v: 100,
          duration: 4,
          ease: "power1.inOut",
          onUpdate: () => counterEl && (counterEl.textContent = String(Math.round(counter.v)).padStart(3, "0")),
        });
        skip.current = () => {
          clearTimeout(timeout);
          vid.pause();
          rip.timeScale(1.6).play();
        };
        return;
      }

      // Paper mode.
      master = gsap.timeline({ defaults: { ease: "expo.out" } });
      master
        .to(counter, {
          v: 100,
          duration: 3.1,
          ease: "power2.inOut",
          onUpdate: () => counterEl && (counterEl.textContent = String(Math.round(counter.v)).padStart(3, "0")),
        }, 0)
        .fromTo(".intro-badge", { scale: 0.4, opacity: 0, rotate: -12 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.8, ease: "back.out(2)" }, 0)
        .fromTo(".intro-presents", { opacity: 0, letterSpacing: "1.4em" }, { opacity: 1, letterSpacing: "0.8em", duration: 0.8 }, 0.2)
        .to([".intro-badge", ".intro-presents"], { y: -40, opacity: 0, duration: 0.45, ease: "power3.in" }, 0.95)
        .fromTo(
          ".intro-sheet",
          { yPercent: -160, rotate: (i) => [-14, 11, -5][i], opacity: 0 },
          { yPercent: 0, rotate: (i) => [-6, 4, -1][i], opacity: 1, duration: 0.7, stagger: 0.12, ease: "power4.out" },
          1.1,
        );

      // Words flip on the top sheet like pages.
      const words = gsap.utils.toArray<HTMLElement>(".intro-word");
      words.forEach((w, i) => {
        const at = 1.75 + i * 0.28;
        master!.fromTo(w, { yPercent: 60, opacity: 0, rotateX: -80 }, { yPercent: 0, opacity: 1, rotateX: 0, duration: 0.13, ease: "power2.out" }, at);
        master!.to(w, { yPercent: -60, opacity: 0, rotateX: 80, duration: 0.1, ease: "power2.in" }, at + 0.17);
      });

      master
        .fromTo(".intro-stamp", { scale: 2.4, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: -3, duration: 0.3, ease: "power4.in" }, 3.2)
        .to(".intro-shake", { x: 8, y: -5, duration: 0.05, repeat: 3, yoyo: true, ease: "none" }, 3.5)
        .fromTo(".intro-ink", { scale: 0, opacity: 0.9 }, { scale: 1, opacity: 0, duration: 0.6, ease: "power2.out" }, 3.48)
        .add(() => rip.play(), 3.95);

      skip.current = () => {
        master?.kill();
        rip.timeScale(1.8).play();
      };

      return () => {
        master?.kill();
        rip.kill();
      };
    },
    { scope: root },
  );

  if (gone) return null;

  return (
    <div ref={root} className="pat-intro fixed inset-0 z-[100]">
      <div ref={layer} className="absolute inset-0 overflow-hidden bg-ink will-change-[clip-path]" aria-hidden="true">
        <div className="intro-shake absolute inset-0">
          {/* blue light + grid, echoing the hero */}
          <div className="absolute left-1/2 top-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(31_107_255/0.22),transparent_60%)]" />

          {video?.desktop || video?.mobile ? (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              playsInline
              preload="auto"
              poster={video.poster}
            >
              {video.mobile && <source src={video.mobile} type="video/mp4" media="(max-width: 767px)" />}
              {video.desktop && <source src={video.desktop} type="video/mp4" />}
            </video>
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              {/* badge */}
              <div className="absolute flex flex-col items-center">
                <Shield className="intro-badge h-36 w-32 opacity-0 sm:h-44 sm:w-40" />
                <p className="intro-presents mt-5 opacity-0 font-display text-xs font-bold tracking-[0.8em] text-paper/70">PRESENTS</p>
              </div>

              {/* paper stack */}
              <div className="relative h-[min(58vw,340px)] w-[min(86vw,560px)] [perspective:800px]">
                {[3, 17, 29].map((seed, i) => (
                  <TornPaper
                    key={seed}
                    seed={seed}
                    depth={2.6}
                    className="intro-sheet absolute inset-0 opacity-0 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)]"
                  >
                    {i < 2 && (
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent_0,transparent_27px,rgb(31_107_255/0.18)_28px)]" />
                    )}
                  </TornPaper>
                ))}
                <div className="absolute inset-0 grid place-items-center overflow-hidden">
                  <span className="intro-ink absolute h-72 w-72 rounded-full bg-ink/15 blur-md" />
                  <div className="relative [transform-style:preserve-3d]">
                    {WORDS.map((w) => (
                      <span key={w} className="intro-word hand absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-6xl text-blue opacity-0 sm:text-8xl">
                        {w}
                      </span>
                    ))}
                  </div>
                  <p className="intro-stamp brush absolute text-center text-[clamp(3rem,13vw,6.5rem)] leading-[0.8] text-ink opacity-0">
                    PAPER
                    <br />
                    <span className="text-[0.55em]">-A-</span>
                    <br />
                    THON
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* torn-paper scraps that fly on the rip */}
          <div className="intro-scraps pointer-events-none absolute left-1/2 top-1/2 opacity-0">
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                className="paper absolute block"
                style={{ width: 10 + ((i * 37) % 28), height: 8 + ((i * 53) % 20), clipPath: "polygon(0 10%, 90% 0, 100% 80%, 15% 100%)" }}
              />
            ))}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 font-display text-[0.65rem] font-bold uppercase tracking-[0.3em] text-paper/60 sm:p-8">
            <span>
              Loading research <span className="intro-count tabular-nums text-blue-bright">000</span>%
            </span>
            <span className="hidden sm:inline">#PaperAthon · 29.09</span>
          </div>
        </div>
      </div>

      {/* glowing tear line */}
      <svg aria-hidden="true" className="intro-tearline pointer-events-none absolute inset-0 h-full w-full opacity-0">
        <path fill="none" stroke="#9cc3ff" strokeWidth="3" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px #1f6bff) drop-shadow(0 0 18px #1f6bff)" }} />
      </svg>

      <button
        type="button"
        onClick={() => skip.current()}
        className="intro-skip absolute right-4 top-4 rounded-full border border-line bg-ink/60 px-4 py-2 font-display text-[0.65rem] font-bold uppercase tracking-[0.25em] text-paper/70 backdrop-blur hover:text-paper sm:right-8 sm:top-8"
      >
        Skip intro
      </button>
    </div>
  );
}
