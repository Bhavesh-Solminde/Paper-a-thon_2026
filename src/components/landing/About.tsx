import { Reveal } from "./Reveal";
import { TornPaper } from "@/components/ui/TornPaper";

const PERKS = [
  {
    title: "Exciting prizes for winners",
    body: "Cash prizes, goodies and certificates for the top papers, plus bragging rights for the year.",
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
    title: "Possibility of project funding",
    body: "Promising ideas can get funding support to grow beyond the paper into a real project.",
    icon: (
      <>
        <path d="M12 2v2M12 20v2" />
        <path d="M16 7.5C16 5.6 14.2 5 12 5s-4 .9-4 2.8c0 4.2 8 2.3 8 6.6 0 1.9-1.8 2.6-4 2.6s-4-.8-4-2.7" />
        <circle cx="12" cy="12" r="10" />
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
            Teams pick a track and write a research paper. Shortlisted teams defend it live in front of a jury
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
