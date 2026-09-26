import { Reveal } from "./Reveal";
import { TornPaper } from "@/components/ui/TornPaper";

const PERKS = [
  {
    title: "Exciting prizes for winners",
    body: "Cash prizes, goodies and certificates for the top papers — and bragging rights for the year.",
    icon: (
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
    ),
  },
  {
    title: "Opportunity to publish",
    body: "Standout papers get mentoring and a real shot at publication. Your research doesn't end on stage.",
    icon: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7M14 3l5 5M14 3v5h5v3M8 9h3M8 13h6M8 17h3" />
        <circle cx="18" cy="17" r="3" />
        <path d="m16.5 19.5-.5 2.5 2-1 2 1-.5-2.5" />
      </>
    ),
  },
  {
    title: "Open to everyone",
    body: "Any year, any branch. If you're curious and can put an idea on paper, there's a seat for you.",
    icon: (
      <>
        <circle cx="12" cy="7" r="3" />
        <circle cx="5" cy="9" r="2" />
        <circle cx="19" cy="9" r="2" />
        <path d="M6 20v-2a6 6 0 0 1 12 0v2M2 20v-1a3 3 0 0 1 3-3M22 20v-1a3 3 0 0 0-3-3" />
      </>
    ),
  },
];

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 md:py-32">
      <Reveal>
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-end">
          <div>
            <p className="eyebrow" data-reveal>What is Paper-a-thon</p>
            <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] sm:text-6xl" data-reveal>
              A research <span className="text-blue-bright">marathon</span>,
              <br /> one paper at a time.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-paper/70" data-reveal>
            Teams pick a track, write a research paper, and — if shortlisted — defend it live in front of a jury
            at the Seminar Hall. It&apos;s where ideas get sharpened into arguments, and arguments into publications.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PERKS.map((p, i) => (
            <div key={p.title} data-reveal={[-3, 2, -2][i]}>
              <TornPaper seed={60 + i * 7} depth={1.6} className="group h-full p-8 pt-10 transition-transform duration-500 hover:-rotate-1 hover:scale-[1.02]">
                <svg viewBox="0 0 24 24" className="h-12 w-12 text-blue" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {p.icon}
                </svg>
                <h3 className="mt-6 font-display text-xl font-black uppercase leading-tight">{p.title}</h3>
                <p className="mt-3 text-ink/70">{p.body}</p>
              </TornPaper>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
