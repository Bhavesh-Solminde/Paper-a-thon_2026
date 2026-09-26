"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteTeam, setPresentationOrder, setTeamStatus, toggleCheckIn } from "@/app/actions/admin";
import type { TeamStatus } from "@/lib/db/schema";

export type AdminTeam = {
  id: string;
  name: string;
  track: string;
  leaderEmail: string;
  members: string[];
  status: TeamStatus;
  paperTitle: string | null;
  paperUrl: string | null;
  presentationOrder: number | null;
  checkedIn: boolean;
  passUrl: string;
};

const LABEL: Record<TeamStatus, string> = {
  registered: "Registered",
  paper_submitted: "Submitted",
  shortlisted: "Shortlisted",
  not_shortlisted: "Not shortlisted",
};

const FILTERS = ["all", "registered", "paper_submitted", "shortlisted", "not_shortlisted"] as const;

export function TeamsTable({ teams }: { teams: AdminTeam[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  const rows = useMemo(
    () =>
      teams.filter(
        (t) =>
          (filter === "all" || t.status === filter) &&
          (!q.trim() || `${t.id} ${t.name} ${t.leaderEmail} ${t.members.join(" ")}`.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [teams, filter, q],
  );

  const act = (fn: () => Promise<void>) => start(fn);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
        <input className="input md:max-w-xs" placeholder="Search teams…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                filter === f ? "border-blue bg-blue text-white" : "border-line text-paper/70"
              }`}
            >
              {f === "all" ? "All" : LABEL[f]} ({f === "all" ? teams.length : teams.filter((t) => t.status === f).length})
            </button>
          ))}
        </div>
      </div>

      <div className={`divide-y divide-line ${pending ? "opacity-60" : ""}`}>
        {rows.map((t) => (
          <div key={t.id} className="grid gap-4 p-4 lg:grid-cols-[1.4fr_1.2fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xs font-bold tracking-widest text-blue-bright">{t.id}</span>
                <span className="font-display font-black uppercase">{t.name}</span>
                {t.checkedIn && <span className="rounded-full bg-ok/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-ok">Checked in</span>}
              </div>
              <p className="mt-1 truncate text-xs text-muted">
                {t.track} · {t.leaderEmail}
              </p>
              <p className="mt-1 truncate text-xs text-paper/70">{t.members.join(", ")}</p>
            </div>
            <div className="min-w-0 text-sm">
              {t.paperUrl ? (
                <a href={t.paperUrl} target="_blank" rel="noreferrer" className="block truncate text-blue-bright underline underline-offset-4">
                  {t.paperTitle || t.paperUrl}
                </a>
              ) : (
                <span className="text-muted">No paper yet</span>
              )}
              <span className="mt-1 inline-block rounded-full border border-line px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider">
                {LABEL[t.status]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {t.status === "shortlisted" && (
                <label className="flex items-center gap-1 text-xs text-muted">
                  #
                  <input
                    type="number"
                    min={1}
                    defaultValue={t.presentationOrder ?? ""}
                    className="input w-16 px-2 py-1.5"
                    aria-label="Presentation order"
                    onBlur={(e) => {
                      const v = e.target.value ? Number(e.target.value) : null;
                      if (v !== t.presentationOrder) act(() => setPresentationOrder(t.id, v));
                    }}
                  />
                </label>
              )}
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${t.status === "shortlisted" ? "bg-blue text-white" : "border border-line hover:border-blue"}`}
                onClick={() => act(() => setTeamStatus(t.id, t.status === "shortlisted" ? (t.paperUrl ? "paper_submitted" : "registered") : "shortlisted"))}
              >
                {t.status === "shortlisted" ? "★ Shortlisted" : "Shortlist"}
              </button>
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${t.status === "not_shortlisted" ? "bg-ink-3 text-muted" : "border border-line hover:border-red-400"}`}
                onClick={() => act(() => setTeamStatus(t.id, t.status === "not_shortlisted" ? (t.paperUrl ? "paper_submitted" : "registered") : "not_shortlisted"))}
              >
                {t.status === "not_shortlisted" ? "Rejected" : "Reject"}
              </button>
              <button className="rounded-full border border-line px-3 py-1.5 text-xs font-bold uppercase hover:border-ok" onClick={() => act(() => toggleCheckIn(t.id, !t.checkedIn))}>
                {t.checkedIn ? "Undo check-in" : "Check in"}
              </button>
              <a href={t.passUrl} target="_blank" rel="noreferrer" className="rounded-full border border-line px-3 py-1.5 text-xs font-bold uppercase hover:border-blue">
                Pass
              </a>
              <button
                className="rounded-full px-2 py-1.5 text-xs text-muted hover:text-red-300"
                onClick={() => confirm(`Delete ${t.name}? This can't be undone.`) && act(() => deleteTeam(t.id))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">No teams.</p>}
      </div>
    </div>
  );
}
