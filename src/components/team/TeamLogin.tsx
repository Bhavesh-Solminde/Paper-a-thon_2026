"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { requestOtp, verifyOtp } from "@/app/actions/auth";
import { OtpInput } from "./OtpInput";

type TeamRow = { id: string; name: string; track: string };

type Step =
  | { kind: "confirm" }
  | { kind: "code"; maskedEmail: string }
  | { kind: "verifying"; maskedEmail: string };

export function TeamLogin({ teams }: { teams: TeamRow[] }) {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("All");
  const [selected, setSelected] = useState<TeamRow | null>(null);

  const tracks = useMemo(() => ["All", ...Array.from(new Set(teams.map((t) => t.track))).sort()], [teams]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teams.filter(
      (t) =>
        (track === "All" || t.track === track) &&
        (!q || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)),
    );
  }, [teams, query, track]);

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search teams</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="input h-12 pl-12"
            placeholder="Search by team name or ID (PAT-001)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:pb-0">
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

      <p className="mt-6 text-sm text-muted">
        {filtered.length} of {teams.length} registered teams
      </p>

      {teams.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-muted">No teams have been registered yet.</div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <motion.li
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
            >
              <button
                onClick={() => setSelected(t)}
                className="card group flex w-full items-center justify-between gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-blue"
              >
                <span className="min-w-0">
                  <span className="font-display text-[0.65rem] font-bold tracking-[0.25em] text-blue-bright">{t.id}</span>
                  <span className="mt-1 block truncate font-display text-lg font-black uppercase">{t.name}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{t.track}</span>
                </span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line transition group-hover:border-blue group-hover:bg-blue">
                  →
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <AnimatePresence>{selected && <LoginSheet key={selected.id} team={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </div>
  );
}

function LoginSheet({ team, onClose }: { team: TeamRow; onClose: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "confirm" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function send() {
    setError(null);
    start(async () => {
      const res = await requestOtp(team.id);
      if (res.ok) {
        setStep({ kind: "code", maskedEmail: res.maskedEmail });
        setCooldown(res.cooldown);
        setCode("");
      } else {
        setError(res.error);
        if (res.retryIn) setCooldown(res.retryIn);
      }
    });
  }

  function verify(value: string) {
    if (step.kind !== "code") return;
    const prev = step;
    setError(null);
    setStep({ kind: "verifying", maskedEmail: step.maskedEmail });
    start(async () => {
      const res = await verifyOtp(team.id, value);
      // Success redirects; we only get here on failure.
      if (res && !res.ok) {
        setError(res.error);
        setStep(prev);
        setCode("");
      }
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="relative w-full max-w-md rounded-t-3xl border border-line bg-ink-2 p-6 pb-8 shadow-2xl sm:rounded-3xl sm:p-8"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-paper" aria-label="Close">
          ✕
        </button>

        <p className="font-display text-[0.65rem] font-bold tracking-[0.25em] text-blue-bright">{team.id}</p>
        <h2 id="login-title" className="mt-1 pr-10 font-display text-2xl font-black uppercase leading-tight">
          {team.name}
        </h2>
        <p className="text-sm text-muted">{team.track}</p>

        <div className="mt-6">
          {step.kind === "confirm" && (
            <>
              <p className="text-paper/80">
                Is this your team? We&apos;ll send a 6-digit code to your <b>team lead&apos;s registered email</b>.
              </p>
              {error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
              <button className="btn btn-primary mt-6 w-full" onClick={send} disabled={pending || cooldown > 0}>
                {pending ? "Sending…" : cooldown > 0 ? `Try again in ${cooldown}s` : "Send login code"}
              </button>
            </>
          )}

          {(step.kind === "code" || step.kind === "verifying") && (
            <>
              <div className="flex items-start gap-3 rounded-2xl bg-blue/10 p-4">
                <span className="text-2xl" aria-hidden>✉️</span>
                <p className="text-sm text-paper/85">
                  Code sent to <b className="text-paper">{step.maskedEmail}</b>. Check your
                  inbox (and spam). It expires in 10 minutes.
                </p>
              </div>
              <div className="mt-6">
                <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={step.kind === "verifying"} invalid={!!error} />
              </div>
              {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
              <button className="btn btn-primary mt-6 w-full" disabled={code.length !== 6 || pending} onClick={() => verify(code)}>
                {step.kind === "verifying" ? "Verifying…" : "Verify & continue"}
              </button>
              <button className="mt-4 w-full text-sm text-muted hover:text-paper disabled:opacity-50" disabled={cooldown > 0 || pending} onClick={send}>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't get it? Resend code"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
