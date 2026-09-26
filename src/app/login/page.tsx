import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/landing/Nav";
import { TeamLogin } from "@/components/team/TeamLogin";
import { listTeamsForLogin } from "@/lib/data";
import { getTeamSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Team Login" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getTeamSession()) redirect("/dashboard");
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
          Pick your team below. We&apos;ll email a one-time code to your team lead&apos;s registered email — enter it to open
          your dashboard.
        </p>
        <TeamLogin teams={teams} />
      </main>
    </>
  );
}
