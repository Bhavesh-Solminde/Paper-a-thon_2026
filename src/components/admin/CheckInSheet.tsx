"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCheckIn } from "@/app/actions/admin";
import { attendance, type CheckInTeam } from "@/lib/checkin";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function AttendanceBadge({ members }: { members: CheckInTeam["members"] }) {
  const a = attendance(members);
  const cls =
    a.state === "present"
      ? "bg-ok/15 text-ok border-ok/30"
      : a.state === "pending"
        ? "bg-warn/15 text-warn border-warn/30"
        : "bg-ink-3 text-muted border-line";
  const label = a.state === "present" ? "Present" : a.state === "pending" ? "Pending" : "Not arrived";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[0.65rem] font-extrabold uppercase tracking-[0.12em] ${cls}`}>
      {label} {a.here}/{a.total}
    </span>
  );
}

/** Member-by-member attendance for one team. Used by the desk scanner, the admin table and the pass page. */
export function CheckInSheet({ team: initial, onSaved }: { team: CheckInTeam; onSaved?: (team: CheckInTeam) => void }) {
  const [team, setTeam] = useState(initial);
  const [present, setPresent] = useState(() => initial.members.map((m) => !!m.checkedInAt));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const dirty = present.some((p, i) => p !== !!team.members[i].checkedInAt);
  const willBe = attendance(present.map((p) => ({ checkedInAt: p ? "x" : null })));

  function save(next = present) {
    setMessage(null);
    start(async () => {
      const res = await saveCheckIn(team.id, next);
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setTeam(res.team);
      setPresent(res.team.members.map((m) => !!m.checkedInAt));
      const a = attendance(res.team.members);
      setMessage({
        ok: true,
        text: a.state === "present" ? "All members checked in. Team is present." : `Saved. ${a.total - a.here} member${a.total - a.here === 1 ? "" : "s"} still to arrive, so the team stays pending.`,
      });
      onSaved?.(res.team);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-xs font-bold tracking-[0.25em] text-blue-bright">{team.id}</p>
          <h3 className="mt-1 font-display text-2xl font-black uppercase leading-tight">{team.name}</h3>
          <p className="text-sm text-muted">{team.track}</p>
        </div>
        <AttendanceBadge members={team.members} />
      </div>

      {!team.shortlisted && (
        <p className="mt-4 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          Heads up: this team is not marked as shortlisted.
        </p>
      )}

      <ul className="mt-5 space-y-2">
        {team.members.map((m, i) => (
          <li key={i}>
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                present[i] ? "border-ok/40 bg-ok/10" : "border-line bg-ink-2 hover:border-paper/30"
              }`}
            >
              <input
                type="checkbox"
                className="h-6 w-6 shrink-0 accent-[#3ddc97]"
                checked={present[i]}
                onChange={(e) => setPresent((p) => p.map((v, j) => (j === i ? e.target.checked : v)))}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {m.name} {m.leader && <span className="ml-1 text-[0.6rem] font-bold uppercase tracking-wider text-blue-bright">Lead</span>}
                </span>
                <span className="text-xs text-muted">
                  {m.checkedInAt ? `Checked in at ${time(m.checkedInAt)}` : present[i] ? "Will be checked in now" : "Not checked in"}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {message && (
        <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.ok ? "bg-ok/10 text-ok" : "bg-red-500/10 text-red-300"}`}>{message.text}</p>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          className="btn btn-ghost flex-1"
          disabled={pending || present.every(Boolean)}
          onClick={() => {
            const all = present.map(() => true);
            setPresent(all);
            save(all);
          }}
        >
          Mark all present
        </button>
        <button className="btn btn-primary flex-1" disabled={pending || !dirty} onClick={() => save()}>
          {pending ? "Saving…" : dirty ? `Save · ${willBe.here}/${willBe.total} present` : "Saved"}
        </button>
      </div>
    </div>
  );
}
