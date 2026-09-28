import Link from "next/link";
import { TornPaper } from "@/components/ui/TornPaper";

export function ShortlistCta({ published, count }: { published: boolean; count: number }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <TornPaper seed={91} depth={1.4} className="relative overflow-hidden px-6 py-14 text-center sm:px-16 sm:py-20">
        <p className="font-display text-xs font-extrabold uppercase tracking-[0.4em] text-blue">The big reveal</p>
        <h2 className="brush mt-4 text-5xl sm:text-7xl">
          {published ? `${count} teams made the cut` : "Shortlist drops soon"}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink/70">
          {published
            ? "See every shortlisted team, their track and members."
            : "Once the panel finishes reviewing, shortlisted teams will be announced right here. Keep your dashboard handy."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shortlisted" className="btn bg-ink text-paper hover:bg-blue">
            View shortlisted teams →
          </Link>
          <Link href="/login" className="btn border-[1.5px] border-ink text-ink hover:bg-ink hover:text-paper">
            Check my team
          </Link>
        </div>
      </TornPaper>
    </section>
  );
}
