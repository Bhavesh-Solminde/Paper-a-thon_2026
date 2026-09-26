"use client";

import { useRef } from "react";
import { useNow } from "@/lib/useNow";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { EVENT, FLOW, eventTime, type FlowItem } from "@/lib/event";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Announcement = { id: number; message: string; createdAt: string };

const KIND: Record<FlowItem["kind"], { label: string; cls: string }> = {
  ceremony: { label: "Ceremony", cls: "bg-paper text-ink" },
  talk: { label: "Briefing", cls: "bg-ink-3 text-paper border border-line" },
  presentations: { label: "Presentations", cls: "bg-blue text-white" },
  break: { label: "Break", cls: "bg-warn/15 text-warn border border-warn/30" },
  wrap: { label: "Wrap-up", cls: "bg-ink-3 text-paper border border-line" },
};

function to12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return { t: `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}`, ap: h < 12 ? "AM" : "PM" };
}

function stateOf(item: FlowItem, i: number, now: number | null) {
  if (now === null) return "upcoming";
  const start = eventTime(item.start).getTime();
  const next = FLOW[i + 1];
  let end = item.end ? eventTime(item.end).getTime() : next ? eventTime(next.start).getTime() : 0;
  if (end <= start) end = start + 30 * 60_000;
  if (now >= end) return "done";
  if (now >= start) return "live";
  return "upcoming";
}

export function EventFlow({ announcements }: { announcements: Announcement[] }) {
  const root = useRef<HTMLElement>(null);
  const now = useNow(30_000);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        ".flow-line-fill",
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".flow-list", start: "top 60%", end: "bottom 60%", scrub: true } },
      );
      gsap.utils.toArray<HTMLElement>(".flow-item").forEach((el) => {
        gsap.from(el.querySelector(".flow-card"), {
          x: 60,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 80%" },
        });
        gsap.from(el.querySelector(".flow-time"), {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 80%" },
        });
        ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          end: "bottom 60%",
          toggleClass: { targets: el, className: "is-active" },
        });
      });
    },
    { scope: root },
  );

  const slot = EVENT.slotMinutes;

  return (
    <section id="flow" ref={root} className="relative scroll-mt-20 border-t border-line bg-ink-2/60 py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[22rem_1fr] lg:gap-20">
        {/* Left: sticky context */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">Event flow</p>
          <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] sm:text-6xl">
            Event day
            <span className="brush mt-1 block text-6xl text-blue-bright sm:text-8xl">29th</span>
          </h2>
          <p className="mt-4 text-paper/70">
            {EVENT.venue}. Everything that happens on the day, in order — timings are IST.
          </p>

          <div className="card mt-8 p-6">
            <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Time per team</p>
            <div className="mt-4 flex items-end gap-3 font-display font-black">
              <div>
                <div className="text-5xl leading-none">{slot.presentation}</div>
                <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-muted">min present</div>
              </div>
              <div className="pb-5 text-2xl text-blue">+</div>
              <div>
                <div className="text-5xl leading-none">{slot.qna}</div>
                <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-muted">min Q&amp;A</div>
              </div>
              <div className="pb-5 text-2xl text-blue">=</div>
              <div>
                <div className="text-5xl leading-none text-blue-bright">{slot.presentation + slot.qna}</div>
                <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-muted">min slot</div>
              </div>
            </div>
            <div className="mt-5 flex h-2 overflow-hidden rounded-full">
              <div className="bg-blue" style={{ flex: slot.presentation }} />
              <div className="bg-paper" style={{ flex: slot.qna }} />
            </div>
          </div>

          <div className="card mt-6 p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Announcements</p>
              <span className="h-2 w-2 rounded-full bg-blue animate-pulse-dot" aria-hidden />
            </div>
            {announcements.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nothing yet — updates from the organisers will appear here.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {announcements.map((a) => (
                  <li key={a.id} className="border-l-2 border-blue pl-3">
                    <p className="text-sm leading-relaxed">{a.message}</p>
                    <time className="mt-1 block text-xs text-muted" suppressHydrationWarning>
                      {new Date(a.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Right: the timeline */}
        <ol className="flow-list relative">
          <div className="absolute left-[5.5rem] top-2 bottom-2 w-0.5 bg-line sm:left-[7.5rem]" aria-hidden>
            <div className="flow-line-fill h-full w-full origin-top bg-blue" />
          </div>

          {FLOW.map((item, i) => {
            const s = stateOf(item, i, now);
            const start = to12(item.start);
            const end = item.end ? to12(item.end) : null;
            return (
              <li key={i} className="flow-item group relative grid grid-cols-[5.5rem_1fr] gap-x-5 pb-10 last:pb-0 sm:grid-cols-[7.5rem_1fr] sm:gap-x-10">
                <div className="flow-time pr-4 text-right">
                  <div className="font-display text-2xl font-black leading-none tabular-nums sm:text-4xl">{start.t}</div>
                  <div className="mt-1 font-display text-xs font-bold tracking-[0.2em] text-muted">{start.ap}</div>
                </div>
                <span
                  className={`absolute left-[5.5rem] top-2 h-4 w-4 -translate-x-1/2 rounded-full border-2 transition-all duration-500 sm:left-[7.5rem] ${
                    s === "live"
                      ? "border-blue bg-blue animate-pulse-dot"
                      : s === "done"
                        ? "border-paper bg-paper"
                        : "border-line bg-ink group-[.is-active]:border-blue group-[.is-active]:bg-blue"
                  }`}
                  aria-hidden
                />
                <div
                  className={`flow-card rounded-2xl border p-5 transition-all duration-500 sm:p-6 ${
                    s === "live"
                      ? "border-blue bg-blue/10 shadow-[0_0_60px_-20px_rgb(31_107_255/0.8)]"
                      : "border-line bg-ink group-[.is-active]:border-blue/60"
                  } ${s === "done" ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 font-display text-[0.62rem] font-extrabold uppercase tracking-[0.15em] ${KIND[item.kind].cls}`}>
                      {KIND[item.kind].label}
                    </span>
                    {end && (
                      <span className="font-display text-xs font-bold tracking-wide text-muted">
                        {start.t} {start.ap} – {end.t} {end.ap}
                      </span>
                    )}
                    {s === "live" && (
                      <span className="ml-auto font-display text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-blue-bright">● Live now</span>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-xl font-black uppercase leading-tight sm:text-2xl">{item.title}</h3>
                  <p className="mt-2 text-paper/70">{item.detail}</p>
                  {item.forTeams && (
                    <p className="mt-4 flex flex-col gap-1 rounded-xl bg-ink-3 p-3 text-sm text-paper/85 sm:flex-row sm:gap-2">
                      <span className="hand shrink-0 text-xl leading-5">teams →</span>
                      <span>{item.forTeams}</span>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
