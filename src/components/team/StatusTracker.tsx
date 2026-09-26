import type { PublicStatus } from "@/lib/data";

const STEPS = [
  { key: "registered", label: "Registered" },
  { key: "paper_submitted", label: "PPT submitted" },
  { key: "under_review", label: "Under review" },
  { key: "result", label: "Result" },
] as const;

function stepIndex(status: PublicStatus) {
  switch (status) {
    case "registered":
      return 0;
    case "paper_submitted":
      return 1;
    case "under_review":
      return 2;
    default:
      return 3;
  }
}

export function StatusTracker({ status }: { status: PublicStatus }) {
  const current = stepIndex(status);
  const resultLabel = status === "shortlisted" ? "Shortlisted" : status === "not_shortlisted" ? "Not shortlisted" : "Result";
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Team progress">
      {STEPS.map((s, i) => {
        const done = i < current || (i === current && i === 3);
        const active = i === current;
        const negative = i === 3 && status === "not_shortlisted";
        return (
          <li key={s.key} className="min-w-0" aria-current={active ? "step" : undefined}>
            <div
              className={`h-1.5 rounded-full ${
                negative ? "bg-muted" : done || active ? "bg-blue" : "bg-line"
              } ${active && !done ? "animate-pulse" : ""}`}
            />
            <p className={`mt-2 truncate text-[0.65rem] font-bold uppercase tracking-wider sm:text-xs ${active ? "text-paper" : "text-muted"}`}>
              {i === 3 ? resultLabel : s.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusBadge({ status, label }: { status: PublicStatus; label: string }) {
  const cls: Record<PublicStatus, string> = {
    registered: "bg-ink-3 text-paper border border-line",
    paper_submitted: "bg-ok/15 text-ok border border-ok/30",
    under_review: "bg-warn/15 text-warn border border-warn/30",
    shortlisted: "bg-blue text-white",
    not_shortlisted: "bg-ink-3 text-muted border border-line",
  };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-[0.7rem] font-extrabold uppercase tracking-[0.15em] ${cls[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
