"use client";

import { useActionState, useState } from "react";
import { submitPaper, type SubmitState } from "@/app/actions/team";

export function PaperForm({
  title,
  url,
  submittedAt,
  open,
}: {
  title: string | null;
  url: string | null;
  submittedAt: string | null;
  open: boolean;
}) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitPaper, undefined);
  const [editing, setEditing] = useState(!url);

  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state?.ok) setEditing(false);
  }

  if (url && !editing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Research paper</p>
          <span className="rounded-full bg-ok/15 px-3 py-1 font-display text-[0.65rem] font-extrabold uppercase tracking-[0.15em] text-ok">
            ✓ Submitted
          </span>
        </div>
        <p className="mt-4 font-display text-xl font-black uppercase leading-tight">{title}</p>
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-sm text-blue-bright underline underline-offset-4">
          {url}
        </a>
        {submittedAt && (
          <p className="mt-3 text-xs text-muted" suppressHydrationWarning>
            Submitted {new Date(submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
          </p>
        )}
        {open && (
          <button className="mt-5 text-sm font-semibold text-paper/70 underline underline-offset-4 hover:text-paper" onClick={() => setEditing(true)}>
            Update submission
          </button>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="card p-6">
        <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Research paper</p>
        <p className="mt-4 text-paper/70">Submissions are closed.</p>
      </div>
    );
  }

  return (
    <form action={action} className="card p-6">
      <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Submit your research paper</p>
      <p className="mt-2 text-sm text-paper/70">
        Paste a shareable link (Google Drive, OneDrive, Overleaf…). Set access to <b>anyone with the link can view</b>.
      </p>
      <label className="mt-5 block">
        <span className="text-sm font-semibold">Paper title</span>
        <input name="title" required defaultValue={title ?? ""} className="input mt-2" placeholder="e.g. Federated learning for rural healthcare" />
      </label>
      <label className="mt-4 block">
        <span className="text-sm font-semibold">Paper link</span>
        <input name="url" type="url" required defaultValue={url ?? ""} className="input mt-2" placeholder="https://drive.google.com/…" />
      </label>
      {state?.error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{state.error}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Submitting…" : url ? "Save changes" : "Submit paper"}
        </button>
        {url && (
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
