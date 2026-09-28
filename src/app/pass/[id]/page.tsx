import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shield } from "@/components/ui/Shield";
import { CheckInSheet } from "@/components/admin/CheckInSheet";
import { attendance, toCheckInTeam } from "@/lib/checkin";
import { isAdmin, passSignature, safeEqual } from "@/lib/auth";
import { STATUS_LABEL, getSettings, getTeam, visibleStatus } from "@/lib/data";

export const metadata: Metadata = { title: "Team Pass", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string }> }) {
  const { id } = await params;
  const { s } = await searchParams;
  if (!s || !safeEqual(s, passSignature(id))) notFound();

  const [team, settings, admin] = await Promise.all([getTeam(id), getSettings(), isAdmin()]);
  if (!team) notFound();
  const status = visibleStatus(team, settings.resultsPublished);
  const att = attendance(team.members);

  if (status !== "shortlisted" && !admin) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        <div className="card p-8 text-center">
          <Shield className="mx-auto h-14 w-12" />
          <p className="mt-5 font-display text-xs font-bold tracking-[0.3em] text-blue-bright">{team.id}</p>
          <h1 className="mt-1 font-display text-2xl font-black uppercase leading-tight">{team.name}</h1>
          <p className="mt-4 text-sm text-paper/70">
            {status === "not_shortlisted" || status === "registered"
              ? "This team wasn't shortlisted, so this is not a valid entry pass."
              : "Entry passes are issued once the shortlist is announced."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-dashed border-line p-5">
          <Shield className="h-11 w-10" />
          <div>
            <p className="font-display text-sm font-black uppercase">Paper-a-thon pass</p>
            <p className="text-xs font-semibold text-ok">✓ Verified, issued by the organisers</p>
          </div>
        </div>
        <div className="p-6">
          <p className="font-display text-xs font-bold tracking-[0.3em] text-blue-bright">{team.id}</p>
          <h1 className="mt-1 font-display text-3xl font-black uppercase leading-tight">{team.name}</h1>
          <p className="text-sm text-muted">{team.track}</p>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">Members</dt>
              <dd className="mt-1">{team.members.map((m) => m.name).join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">Status</dt>
              <dd className="mt-1 font-semibold">{STATUS_LABEL[status]}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">Check-in</dt>
              <dd className={`mt-1 font-semibold ${att.state === "present" ? "text-ok" : att.state === "pending" ? "text-warn" : "text-muted"}`}>
                {att.state === "present" ? "Present" : att.state === "pending" ? "Pending" : "Not arrived"} · {att.here}/{att.total} members
              </dd>
            </div>
          </dl>
          {admin && (
            <div className="mt-6 border-t border-dashed border-line pt-6">
              <CheckInSheet team={toCheckInTeam(team)} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
