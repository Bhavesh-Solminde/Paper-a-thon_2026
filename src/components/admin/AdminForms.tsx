"use client";

import { useActionState, useTransition } from "react";
import {
  addAnnouncement,
  addTeam,
  adminLogin,
  deleteAnnouncement,
  importTeams,
  updateSetting,
  type FormResult,
} from "@/app/actions/admin";
import { TRACKS } from "@/lib/event";

function Result({ state }: { state: FormResult }) {
  if (!state) return null;
  return (
    <>
      {state.message && <p className="mt-3 text-sm text-ok">{state.message}</p>}
      {state.error && <p className="mt-3 text-sm text-red-300">{state.error}</p>}
    </>
  );
}

export function AdminLoginForm() {
  const [error, action, pending] = useActionState(adminLogin, undefined);
  return (
    <form action={action} className="card mx-auto mt-10 max-w-sm p-8">
      <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Organiser access</p>
      <input name="password" type="password" required autoFocus className="input mt-4" placeholder="Admin password" />
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <button className="btn btn-primary mt-5 w-full" disabled={pending}>
        {pending ? "Checking…" : "Enter console"}
      </button>
    </form>
  );
}

export function SettingToggle({ name, label, hint, value }: { name: "resultsPublished"; label: string; hint: string; value: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      role="switch"
      aria-checked={value}
      disabled={pending}
      onClick={() => start(() => updateSetting(name, !value))}
      className="card flex w-full items-center justify-between gap-4 p-5 text-left disabled:opacity-60"
    >
      <span>
        <span className="block font-display text-sm font-black uppercase">{label}</span>
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${value ? "bg-blue" : "bg-line"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${value ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

export function AnnouncementForm({ items }: { items: { id: number; message: string; createdAt: string }[] }) {
  const [state, action, pending] = useActionState(addAnnouncement, undefined);
  const [busy, start] = useTransition();
  return (
    <div className="card p-6">
      <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Announcements</p>
      <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input name="message" className="input" placeholder="e.g. Session II starts 10 min late" maxLength={280} />
        <button className="btn btn-primary shrink-0" disabled={pending}>Post</button>
      </form>
      <Result state={state} />
      <ul className="mt-4 space-y-2">
        {items.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-ink-3 p-3 text-sm">
            <span>{a.message}</span>
            <button className="shrink-0 text-xs text-muted hover:text-red-300" disabled={busy} onClick={() => start(() => deleteAnnouncement(a.id))}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AddTeamForm() {
  const [state, action, pending] = useActionState(addTeam, undefined);
  return (
    <form action={action} className="card space-y-3 p-6">
      <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Add a team</p>
      <input name="name" required className="input" placeholder="Team name" />
      <select name="track" required className="input" defaultValue="">
        <option value="" disabled>Track…</option>
        {TRACKS.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <input name="leaderEmail" type="email" required className="input" placeholder="Team lead email (receives login codes)" />
      <textarea name="members" required rows={3} className="input" placeholder={"Members, one per line, team lead first"} />
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Adding…" : "Add team"}</button>
      <Result state={state} />
    </form>
  );
}

export function ImportForm() {
  const [state, action, pending] = useActionState(importTeams, undefined);
  return (
    <form action={action} className="card space-y-3 p-6">
      <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Bulk import (CSV)</p>
      <p className="text-xs text-muted">
        Header row: <code className="text-paper">team_name,track,leader_email,members</code>. Members are separated by{" "}
        <code className="text-paper">;</code>, lead first. Works with a Google Forms export after renaming columns.
      </p>
      <input name="file" type="file" accept=".csv,text/csv" required className="input file:mr-3 file:rounded-full file:border-0 file:bg-blue file:px-3 file:py-1 file:text-white" />
      <button className="btn btn-ghost w-full" disabled={pending}>{pending ? "Importing…" : "Import"}</button>
      <Result state={state} />
    </form>
  );
}
