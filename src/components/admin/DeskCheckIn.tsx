"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import jsQR from "jsqr";
import { lookupPass, lookupTeamById, type CheckInResult } from "@/app/actions/admin";
import type { CheckInTeam } from "@/lib/checkin";
import { CheckInSheet } from "./CheckInSheet";

type BarcodeDetectorLike = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
  }
}

export function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-ink p-5 pb-8 sm:rounded-3xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-line bg-ink text-muted hover:text-paper" aria-label="Close">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

/** Live camera QR scanner. Uses the native BarcodeDetector where available, jsQR everywhere else. */
function Scanner({ onScan }: { onScan: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let last = 0;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;

    const found = (text: string) => {
      if (done.current) return;
      done.current = true;
      navigator.vibrate?.(80);
      onScanRef.current(text);
    };

    const tick = async (t: number) => {
      raf = requestAnimationFrame(tick);
      const v = video.current;
      if (!v || v.readyState < 2 || t - last < 150 || done.current) return;
      last = t;
      try {
        if (detector) {
          const codes = await detector.detect(v);
          if (codes[0]?.rawValue) return found(codes[0].rawValue);
        } else {
          const scale = Math.min(1, 960 / v.videoWidth);
          canvas.width = Math.round(v.videoWidth * scale);
          canvas.height = Math.round(v.videoHeight * scale);
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (code?.data) return found(code.data);
        }
      } catch {
        /* keep scanning */
      }
    };

    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled || !video.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.current.srcObject = stream;
        // play() can reject harmlessly (e.g. interrupted by a re-render); the video still runs, so keep scanning.
        video.current.play().catch(() => {});
        raf = requestAnimationFrame(tick);
      } catch (e) {
        const name = (e as Error)?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access for this site in your browser settings, or enter the team ID below."
            : "Couldn't start the camera on this device. Enter the team ID below instead.",
        );
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
      <video ref={video} className="h-full w-full object-cover" muted playsInline />
      {error ? (
        <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-paper/80">{error}</p>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-[14%] rounded-3xl border-2 border-blue shadow-[0_0_0_9999px_rgb(0_0_0/0.45)]" />
          <div className="pointer-events-none absolute inset-x-[14%] top-1/2 h-0.5 animate-pulse bg-blue-bright shadow-[0_0_12px_#4a90ff]" />
          <p className="absolute inset-x-0 bottom-3 text-center text-xs font-semibold text-paper/80">Point at the team&apos;s QR pass</p>
        </>
      )}
    </div>
  );
}

type Step = { kind: "scan" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "team"; team: CheckInTeam };

/** The desk's check-in station: scan a pass (or type an ID), then tick off members. */
export function DeskCheckIn({ present, pending, total }: { present: number; pending: number; total: number }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "scan" });
  const [scanKey, setScanKey] = useState(0);
  const [manual, setManual] = useState("");
  const [, start] = useTransition();

  const handle = (p: Promise<CheckInResult>) => {
    setStep({ kind: "loading" });
    setOpen(true);
    start(async () => {
      const res = await p;
      setStep(res.ok ? { kind: "team", team: res.team } : { kind: "error", message: res.error });
    });
  };

  const scanAgain = () => {
    setStep({ kind: "scan" });
    setScanKey((k) => k + 1);
  };

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Desk check-in</p>
          <p className="mt-2 text-sm text-paper/80">
            <b className="text-ok">{present}</b> {present === 1 ? "team" : "teams"} present · <b className="text-warn">{pending}</b> pending ·{" "}
            {Math.max(0, total - present - pending)} not arrived
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="btn btn-primary"
            onClick={() => {
              scanAgain();
              setOpen(true);
            }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" />
            </svg>
            Scan QR
          </button>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (manual.trim()) handle(lookupTeamById(manual));
            }}
          >
            <input className="input w-36" placeholder="PAT-007" value={manual} onChange={(e) => setManual(e.target.value)} aria-label="Team ID" />
            <button className="btn btn-ghost px-4">Open</button>
          </form>
        </div>
      </div>

      {open && (
        <Modal label="Check in a team" onClose={() => setOpen(false)}>
          {step.kind === "scan" && (
            <>
              <p className="mb-4 pr-10 font-display text-lg font-black uppercase">Scan team pass</p>
              <Scanner key={scanKey} onScan={(text) => handle(lookupPass(text))} />
            </>
          )}
          {step.kind === "loading" && <p className="py-16 text-center text-muted">Looking up the team…</p>}
          {step.kind === "error" && (
            <div className="py-6 text-center">
              <p className="text-4xl" aria-hidden>
                ⚠️
              </p>
              <p className="mt-3 text-paper/85">{step.message}</p>
              <button className="btn btn-primary mt-6" onClick={scanAgain}>
                Scan again
              </button>
            </div>
          )}
          {step.kind === "team" && (
            <>
              <div className="pr-10">
                <CheckInSheet team={step.team} />
              </div>
              <button className="btn btn-ghost mt-3 w-full" onClick={scanAgain}>
                Scan next team
              </button>
            </>
          )}
        </Modal>
      )}
    </section>
  );
}
