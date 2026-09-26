import type { Metadata } from "next";
import Link from "next/link";
import { AddTeamForm, AdminLoginForm, AnnouncementForm, ImportForm, SettingToggle } from "@/components/admin/AdminForms";
import { TeamsTable } from "@/components/admin/TeamsTable";
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
          <Shield className="h-14 w-12" />
          <h1 className="mt-4 font-display text-3xl font-black uppercase">Organiser console</h1>
        </div>
        <AdminLoginForm />
      </main>
    );
  }

  const [teams, settings, announcements] = await Promise.all([listAllTeams(), getSettings(), listAnnouncements(20)]);
  const count = (s: string) => teams.filter((t) => t.status === s).length;
  const stats = [
    ["Registered", teams.length],
    ["Papers in", teams.filter((t) => t.paperUrl).length],
    ["Shortlisted", count("shortlisted")],
    ["Checked in", teams.filter((t) => t.checkedIn).length],
  ] as const;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Shield className="h-10 w-9" />
          <span className="font-display text-lg font-black uppercase">Organiser console</span>
        </Link>
        <form action={adminLogout}>
          <button className="text-sm text-muted underline underline-offset-4 hover:text-paper">Log out</button>
        </form>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-5">
            <p className="font-display text-4xl font-black">{n}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <SettingToggle
          name="resultsPublished"
          label="Publish results"
          hint="Reveals Shortlisted / Not shortlisted to teams and the public board."
          value={settings.resultsPublished}
        />
        <SettingToggle
          name="submissionsOpen"
          label="Submissions open"
          hint="Lets teams submit or update their paper link."
          value={settings.submissionsOpen}
        />
      </section>

      <section className="mt-6">
        <TeamsTable
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            track: t.track,
            leaderEmail: t.leaderEmail,
            members: t.members.map((m) => m.name),
            status: t.status,
            paperTitle: t.paperTitle,
            paperUrl: t.paperUrl,
            presentationOrder: t.presentationOrder,
            checkedIn: t.checkedIn,
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
