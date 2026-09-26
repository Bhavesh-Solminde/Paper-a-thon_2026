"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";

export type BoardTeam = {
  id: string;
  name: string;
  track: string;
  members: string[];
  slot: string | null;
};

export function ShortlistBoard({ teams }: { teams: BoardTeam[] }) {
  const [track, setTrack] = useState("All");
  const [q, setQ] = useState("");
  const tracks = useMemo(() => ["All", ...Array.from(new Set(teams.map((t) => t.track))).sort()], [teams]);
  const shown = teams.filter(
    (t) =>
      (track === "All" || t.track === track) &&
      (!q.trim() || `${t.name} ${t.id} ${t.members.join(" ")}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <>
      <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center">
        <input className="input h-12 md:max-w-sm" placeholder="Search team, ID or member…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search shortlisted teams" />
        <div className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {tracks.map((t) => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                track === t ? "border-blue bg-blue text-white" : "border-line text-paper/70 hover:border-paper/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t, i) => (
          <motion.li
            key={t.id}
            initial={{ opacity: 0, y: 30, rotate: i % 2 ? 1 : -1 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="card group relative overflow-hidden p-6 transition hover:border-blue"
          >
            <span className="brush pointer-events-none absolute -right-2 -top-4 text-8xl leading-none text-white/[0.04]" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-[0.65rem] font-bold tracking-[0.25em] text-blue-bright">{t.id}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue px-2.5 py-1 font-display text-[0.6rem] font-extrabold uppercase tracking-[0.15em] text-white">
                ★ Shortlisted
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-black uppercase leading-tight">{t.name}</h2>
            <p className="mt-1 text-sm text-muted">{t.track}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {t.members.map((m) => (
                <li key={m} className="rounded-full bg-ink-3 px-3 py-1 text-xs text-paper/85">{m}</li>
              ))}
            </ul>
            {t.slot && (
              <p className="mt-5 border-t border-dashed border-line pt-4 font-display text-xs font-bold uppercase tracking-[0.15em] text-paper/70">
                Presents at <span className="text-blue-bright">{t.slot}</span>
              </p>
            )}
          </motion.li>
        ))}
      </ul>
      {shown.length === 0 && <p className="mt-10 text-center text-muted">No teams match that filter.</p>}
    </>
  );
}
