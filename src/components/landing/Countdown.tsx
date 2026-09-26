"use client";

import { useNow } from "@/lib/useNow";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

export function Countdown({ to, end }: { to: string; end: string }) {
  const now = useNow(1000);

  const target = new Date(to).getTime();
  const finish = new Date(end).getTime();

  if (now !== null && now >= finish) {
    return <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted">That&apos;s a wrap — thank you for coming!</p>;
  }
  if (now !== null && now >= target) {
    return (
      <p className="flex items-center gap-3 font-display text-sm font-extrabold uppercase tracking-[0.2em]">
        <span className="h-2.5 w-2.5 rounded-full bg-blue animate-pulse-dot" /> Happening now · Seminar Hall
      </p>
    );
  }

  const p = parts(now === null ? 0 : target - now);
  const cells: [string, number][] = [
    ["Days", p.days],
    ["Hours", p.hours],
    ["Mins", p.mins],
    ["Secs", p.secs],
  ];
  return (
    <div className="flex items-stretch gap-2 sm:gap-3" aria-label="Countdown to event day">
      {cells.map(([label, v]) => (
        <div key={label} className="card min-w-16 px-3 py-2 text-center sm:min-w-20 sm:px-4 sm:py-3">
          <div className="font-display text-2xl font-black tabular-nums sm:text-3xl" suppressHydrationWarning>
            {now === null ? "––" : String(v).padStart(2, "0")}
          </div>
          <div className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}
