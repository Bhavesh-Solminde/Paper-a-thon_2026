import Link from "next/link";
import { EVENT } from "@/lib/event";
import { Shield } from "@/components/ui/Shield";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Shield className="h-12 w-11" />
              <p className="font-display text-sm font-black uppercase leading-tight">
                {EVENT.club}
                <span className="block text-xs font-bold tracking-[0.3em] text-blue-bright">Connect · Learn · Grow</span>
              </p>
            </div>
            <p className="mt-6 text-sm text-muted">
              {EVENT.dateLabel} · {EVENT.timeLabel} · {EVENT.venue}
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-paper/70">
            <Link href="/#flow" className="hover:text-blue-bright">Event flow</Link>
            <Link href="/shortlisted" className="hover:text-blue-bright">Shortlisted</Link>
            <Link href="/login" className="hover:text-blue-bright">Team login</Link>
            <Link href="/#faq" className="hover:text-blue-bright">FAQ</Link>
          </nav>
        </div>
        <p aria-hidden className="brush mt-16 select-none whitespace-nowrap text-center text-[clamp(2.5rem,12vw,12rem)] leading-none text-white/[0.05]">
          PAPER-A-THON
        </p>
        <div className="mt-6 flex flex-col items-center justify-between gap-2 text-xs text-muted sm:flex-row">
          <span>© 2026 {EVENT.club}</span>
          <span className="font-display font-bold tracking-widest">{EVENT.hashtags.join("  ")}</span>
        </div>
      </div>
    </footer>
  );
}
