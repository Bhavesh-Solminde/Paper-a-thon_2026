import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/landing/Nav";
import { TeamLogin } from "@/components/team/TeamLogin";
import { getTeam, listTeamsForLogin } from "@/lib/data";
import { getTeamSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Team Login" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const teamId = await getTeamSession();
  const current = teamId ? await getTeam(teamId) : null;
  if (current) {
    // Already signed in: say so, instead of bouncing to the dashboard (which looked like a dead button).
    return (
      <>
        <Nav loggedIn />
        <main className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4 pt-28 pb-20 sm:px-6">
          <div className="card w-full p-8 text-center">
            <p className="eyebrow">Team login</p>
            <p className="mt-6 text-paper/70">You&apos;re signed in as</p>
            <p className="mt-1 font-display text-3xl font-black uppercase leading-tight">{current.name}</p>
            <p className="mt-1 font-display text-xs font-bold tracking-[0.3em] text-blue-bright">{current.id}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/dashboard" className="btn btn-primary">
                Open dashboard <span aria-hidden>→</span>
              </Link>
              <form action={logout}>
                <input type="hidden" name="next" value="/login" />
                <button className="btn btn-ghost w-full">Switch team</button>
              </form>
            </div>
          </div>
        </main>
      </>
    );
  }
  const teams = await listTeamsForLogin();
  return (
    <>
      <Nav />
      <main className="mx-auto min-h-dvh max-w-6xl px-4 pt-28 pb-20 sm:px-6 md:pt-36">
        <p className="eyebrow">Team login</p>
        <h1 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] sm:text-6xl">
          Find your <span className="brush text-blue-bright">team</span>
        </h1>
        <p className="mt-4 max-w-xl text-paper/70">
          Pick your team below. We&apos;ll email a one-time code to your team lead&apos;s registered email. Enter it to open
          your dashboard.
        </p>
        <TeamLogin teams={teams} />
      </main>
    </>
  );
}
