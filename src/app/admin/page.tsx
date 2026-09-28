import type { Metadata } from "next";
import Link from "next/link";
import { AddTeamForm, AdminLoginForm, AnnouncementForm, ImportForm, SettingToggle } from "@/components/admin/AdminForms";
import { TeamsTable } from "@/components/admin/TeamsTable";
import { DeskCheckIn } from "@/components/admin/DeskCheckIn";
import { attendance, toCheckInTeam } from "@/lib/checkin";
import { Shield } from "@/components/ui/Shield";
import { isAdmin } from "@/lib/auth";
import { getSettings, listAllTeams, listAnnouncements } from "@/lib/data";
import { passUrl } from "@/lib/pass";
import { adminLogout } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="min-h-dvh px-4 pt-24">
        <div className="flex flex-col items-center text-center">
          <Shield className="h-20 w-[4.6rem]" />
          <h1 className="mt-4 font-display text-3xl font-black uppercase">Organiser console</h1>
        </div>
        <AdminLoginForm />
      </main>
    );
  }

  const [teams, settings, announcements] = await Promise.all([listAllTeams(), getSettings(), listAnnouncements(20)]);
  const shortlisted = teams.filter((t) => t.status === "shortlisted").length;
  const states = teams.map((t) => attendance(t.members).state);
  const present = states.filter((s) => s === "present").length;
  const pendingTeams = states.filter((s) => s === "pending").length;
  const stats = [
    ["Teams", teams.length],
    ["Shortlisted", shortlisted],
    ["Present", present],
    ["Pending", pendingTeams],
  ] as const;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Shield className="h-11 w-10" />
          <span className="font-display text-lg font-black uppercase">Organiser console</span>
        </Link>
        <form action={adminLogout}>
          <button className="text-sm text-muted underline underline-offset-4 hover:text-paper">Log out</button>
        </form>
      </header>

      <div className="mt-6">
        <DeskCheckIn present={present} pending={pendingTeams} total={shortlisted || teams.length} />
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-5">
            <p className="font-display text-4xl font-black">{n}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <SettingToggle
          name="resultsPublished"
          label="Publish results"
          hint="Shortlisted teams see the good news and get their QR pass; every other team sees “Not shortlisted”. The public board goes live."
          value={settings.resultsPublished}
        />
      </section>

      <section className="mt-6">
        <TeamsTable
          teams={teams.map((t) => ({
            ...toCheckInTeam(t),
            leaderEmail: t.leaderEmail,
            status: t.status,
            presentationOrder: t.presentationOrder,
            passUrl: passUrl(t.id),
          }))}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <AnnouncementForm items={announcements.map((a) => ({ id: a.id, message: a.message, createdAt: a.createdAt.toISOString() }))} />
        <AddTeamForm />
        <ImportForm />
      </section>
    </main>
  );
}
