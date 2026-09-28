import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { ShortlistBoard } from "@/components/team/ShortlistBoard";
import { getSettings, listShortlisted } from "@/lib/data";
import { getTeamSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Shortlisted Teams" };
export const dynamic = "force-dynamic";

export default async function ShortlistedPage() {
  const [settings, teams, teamId] = await Promise.all([getSettings(), listShortlisted(), getTeamSession()]);

  return (
    <>
      <Nav loggedIn={!!teamId} />
      <main className="mx-auto min-h-dvh max-w-7xl px-4 pt-28 pb-24 sm:px-6 md:pt-36">
        <p className="eyebrow">Public board</p>
        <h1 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] sm:text-7xl">
          Shortlisted <span className="brush text-blue-bright">teams</span>
        </h1>

        {!settings.resultsPublished ? (
          <div className="card mt-12 flex flex-col items-center p-10 text-center sm:p-16">
            <span className="h-3 w-3 rounded-full bg-warn animate-pulse" />
            <h2 className="brush mt-6 text-4xl sm:text-6xl">Under review</h2>
            <p className="mt-4 max-w-md text-paper/70">
              The panel is still reviewing every PPT. The shortlist will be published here, so check back soon.
            </p>
            <Link href="/login" className="btn btn-primary mt-8">Check my team status</Link>
          </div>
        ) : teams.length === 0 ? (
          <p className="card mt-12 p-10 text-center text-muted">No teams have been shortlisted yet.</p>
        ) : (
          <>
            <p className="mt-4 max-w-xl text-paper/70">
              {teams.length} teams made it through the PPT round and will present on the 29th at the Seminar Hall. Each team gets 7 minutes to present and 3 minutes of Q&amp;A.
            </p>
            <ShortlistBoard
              teams={teams.map((t) => ({
                id: t.id,
                name: t.name,
                track: t.track,
                members: t.members.map((m) => m.name),
              }))}
            />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
