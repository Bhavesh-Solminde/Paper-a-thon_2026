"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteTeam, setPresentationOrder, setTeamStatus } from "@/app/actions/admin";
import type { TeamStatus } from "@/lib/db/schema";
import { attendance, type CheckInTeam } from "@/lib/checkin";
import { AttendanceBadge, CheckInSheet } from "./CheckInSheet";
import { Modal } from "./DeskCheckIn";

export type AdminTeam = CheckInTeam & {
  leaderEmail: string;
  status: TeamStatus;
  presentationOrder: number | null;
  passUrl: string;
};

// PPTs came in through the Google Form, so a team is either shortlisted or not —
// everyone not shortlisted is shown "Not shortlisted" once results are published.
const FILTERS = [
  { key: "all", label: "All", match: () => true },
  { key: "shortlisted", label: "Shortlisted", match: (t: AdminTeam) => t.status === "shortlisted" },
  { key: "others", label: "Not shortlisted", match: (t: AdminTeam) => t.status !== "shortlisted" && t.status !== "registered" },
  { key: "noppt", label: "No PPT", match: (t: AdminTeam) => t.status === "registered" },
  { key: "present", label: "Present", match: (t: AdminTeam) => attendance(t.members).state === "present" },
  { key: "pending", label: "Pending", match: (t: AdminTeam) => attendance(t.members).state === "pending" },
] as const;

export function TeamsTable({ teams }: { teams: AdminTeam[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [checking, setChecking] = useState<AdminTeam | null>(null);

  const rows = useMemo(
    () =>
      teams.filter(
        (t) =>
          FILTERS.find((f) => f.key === filter)!.match(t) &&
          (!q.trim() || `${t.id} ${t.name} ${t.leaderEmail} ${t.members.map((m) => m.name).join(" ")}`.toLowerCase().includes(q.trim().toLowerCase())),
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
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                filter === f.key ? "border-blue bg-blue text-white" : "border-line text-paper/70"
              }`}
            >
              {f.label} ({teams.filter(f.match).length})
            </button>
          ))}
        </div>
      </div>

      <div className={`divide-y divide-line ${pending ? "opacity-60" : ""}`}>
        {rows.map((t) => (
          <div key={t.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xs font-bold tracking-widest text-blue-bright">{t.id}</span>
                <span className="font-display font-black uppercase">{t.name}</span>
                {t.status === "registered" && (
                  <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted">No PPT</span>
                )}
                {attendance(t.members).state !== "absent" && <AttendanceBadge members={t.members} />}
              </div>
              <p className="mt-1 truncate text-xs text-muted">
                {t.track} · {t.leaderEmail}
              </p>
              <p className="mt-1 truncate text-xs text-paper/70">{t.members.map((m) => m.name).join(", ")}</p>
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
              {t.status !== "registered" && (
                <button
                  className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${t.status === "shortlisted" ? "bg-blue text-white" : "border border-line hover:border-blue"}`}
                  onClick={() => act(() => setTeamStatus(t.id, t.status === "shortlisted" ? "paper_submitted" : "shortlisted"))}
                >
                  {t.status === "shortlisted" ? "★ Shortlisted" : "Shortlist"}
                </button>
              )}
              <button className="rounded-full border border-line px-3 py-1.5 text-xs font-bold uppercase hover:border-ok" onClick={() => setChecking(t)}>
                {attendance(t.members).state === "absent" ? "Check in" : "Attendance"}
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

      {checking && (
        <Modal label={`Check in ${checking.name}`} onClose={() => setChecking(null)}>
          <div className="pr-10">
            <CheckInSheet team={checking} />
          </div>
        </Modal>
      )}
    </div>
  );
}
