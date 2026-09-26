import fs from "node:fs";
import path from "node:path";
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

// Higgsfield-generated intro clips (see scripts/generate-intro.ts). Paper animation is used when absent.
function introVideo() {
  const dir = path.join(process.cwd(), "public", "intro");
  const has = (f: string) => fs.existsSync(path.join(dir, f));
  const sources = [
    { src: "/intro/intro.webm", type: "video/webm" },
    { src: "/intro/intro.mp4", type: "video/mp4" },
  ].filter((s) => has(path.basename(s.src)));
  if (!sources.length) return undefined;
  return { sources, poster: ["poster.jpg", "poster.webp", "poster.png"].filter(has).map((f) => `/intro/${f}`)[0] };
}

export default async function Home() {
  const [settings, announcements, shortlisted, teamId] = await Promise.all([
    getSettings(),
    listAnnouncements(5),
    listShortlisted(),
    getTeamSession(),
  ]);

  return (
    <>
      <Intro video={introVideo()} />
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
