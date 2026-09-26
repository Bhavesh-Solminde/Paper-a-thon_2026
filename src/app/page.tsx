import { Nav } from "@/components/landing/Nav";
import { Intro } from "@/components/landing/Intro";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { About } from "@/components/landing/About";
import { Journey } from "@/components/landing/Journey";
import { EventFlow } from "@/components/landing/EventFlow";
import { ShortlistCta } from "@/components/landing/ShortlistCta";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { getSettings, listAnnouncements, listShortlisted } from "@/lib/data";
import { getTeamSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Higgsfield-generated intro clip (see scripts/generate-intro.ts): the original master, untouched
// (only remuxed for fast start). Desktop only; phones skip the intro entirely. Files live in public/intro/
// and are listed here rather than checked on disk, because Vercel doesn't ship public/ to functions.
// Set to undefined to use the paper intro instead.
const INTRO_VIDEO = {
  sources: [{ src: "/intro/intro-hd.mp4", type: "video/mp4" }],
  poster: "/intro/poster.jpg",
};

export default async function Home() {
  const [settings, announcements, shortlisted, teamId] = await Promise.all([
    getSettings(),
    listAnnouncements(5),
    listShortlisted(),
    getTeamSession(),
  ]);

  return (
    <>
      <Intro video={INTRO_VIDEO} />
      <SmoothScroll />
      <Nav loggedIn={!!teamId} />
      <main>
        <Hero loggedIn={!!teamId} />
        <Marquee />
        <About />
        <Journey />
        <EventFlow announcements={announcements.map((a) => ({ id: a.id, message: a.message, createdAt: a.createdAt.toISOString() }))} />
        <ShortlistCta published={settings.resultsPublished} count={shortlisted.length} />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
