import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/landing/Nav";
import { PaperForm } from "@/components/team/PaperForm";
import { QrPass } from "@/components/team/QrPass";
import { ResultBanner } from "@/components/team/ResultBanner";
import { StatusBadge, StatusTracker } from "@/components/team/StatusTracker";
import { getTeamSession } from "@/lib/auth";
import { STATUS_LABEL, getSettings, getTeam, listAnnouncements, slotFor, visibleStatus } from "@/lib/data";
import { passData } from "@/lib/pass";
import { logout } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Team Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const teamId = await getTeamSession();
  if (!teamId) redirect("/login");
  const [team, settings, announcements] = await Promise.all([getTeam(teamId), getSettings(), listAnnouncements(3)]);
  if (!team) redirect("/login");

  const status = visibleStatus(team, settings.resultsPublished);
  const slot = status === "shortlisted" ? slotFor(team.presentationOrder) : null;
  const reviewed = team.status === "shortlisted" || team.status === "not_shortlisted";

  return (
    <>
      <Nav loggedIn />
      <main className="mx-auto min-h-dvh max-w-6xl px-4 pt-28 pb-20 sm:px-6 md:pt-32">
        {/* Team profile card */}
        <section className="card relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="font-display text-xs font-bold tracking-[0.3em] text-blue-bright">{team.id}</p>
              <h1 className="mt-2 font-display text-4xl font-black uppercase leading-[0.95] break-words sm:text-6xl">{team.name}</h1>
              <p className="mt-3 inline-flex rounded-full border border-line px-3 py-1 text-sm text-paper/80">{team.track}</p>
            </div>
            <div className="flex items-center gap-3 md:flex-col md:items-end">
              <StatusBadge status={status} label={STATUS_LABEL[status]} />
              <form action={logout}>
                <button className="text-sm text-muted underline underline-offset-4 hover:text-paper">Log out</button>
              </form>
            </div>
          </div>

          <div className="relative mt-8">
            <StatusTracker status={status} />
          </div>

          <div className="relative mt-8 border-t border-line pt-6">
            <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Team members</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {team.members.map((m, i) => (
                <li key={i} className="flex items-center gap-2 rounded-full bg-ink-3 py-1.5 pr-4 pl-1.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-blue font-display text-xs font-black text-white">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm">{m.name}</span>
                  {m.leader && <span className="text-[0.6rem] font-bold uppercase tracking-wider text-blue-bright">Lead</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {status === "shortlisted" || status === "not_shortlisted" ? (
          <section className="mt-6">
            <ResultBanner shortlisted={status === "shortlisted"} teamName={team.name} slot={slot} />
          </section>
        ) : status === "under_review" ? (
          <section className="card mt-6 flex items-center gap-4 p-6">
            <span className="h-3 w-3 shrink-0 rounded-full bg-warn animate-pulse" />
            <p className="text-paper/80">
              Your paper is with the review panel. Shortlisting results will appear here and on the{" "}
              <Link href="/shortlisted" className="text-blue-bright underline underline-offset-4">public board</Link>.
            </p>
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <PaperForm
              title={team.paperTitle}
              url={team.paperUrl}
              submittedAt={team.submittedAt?.toISOString() ?? null}
              open={settings.submissionsOpen && !reviewed}
            />

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Latest announcements</p>
                <Link href="/#flow" className="text-xs font-bold uppercase tracking-wider text-blue-bright">Event flow →</Link>
              </div>
              {announcements.length ? (
                <ul className="mt-4 space-y-3">
                  {announcements.map((a) => (
                    <li key={a.id} className="border-l-2 border-blue pl-3 text-sm">{a.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">No announcements yet.</p>
              )}
            </div>
          </div>

          <QrPass pass={passData(team, settings.resultsPublished)} />
        </div>
      </main>
    </>
  );
}
