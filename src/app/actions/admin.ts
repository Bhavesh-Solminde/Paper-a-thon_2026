"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { announcements, db, teams, type Member, type TeamStatus } from "@/lib/db";
import { getTeam, setSetting, type Settings } from "@/lib/data";
import { parsePassQr, toCheckInTeam, type CheckInTeam } from "@/lib/checkin";
import { clearAdminSession, isAdmin, passSignature, safeEqual, setAdminSession } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";
import { matchTrack } from "@/lib/event";

async function guard() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function adminLogin(_prev: string | undefined, form: FormData) {
  const expected = process.env.ADMIN_PASSWORD;
  const given = String(form.get("password") ?? "");
  if (!expected || !safeEqual(given, expected)) return "Wrong password.";
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin");
}

export async function setTeamStatus(teamId: string, status: TeamStatus) {
  await guard();
  await db.update(teams).set({ status }).where(eq(teams.id, teamId));
  // Shortlisted teams get appended to the presentation order automatically.
  if (status === "shortlisted") {
    await db.execute(sql`
      update teams set presentation_order = coalesce(
        (select max(presentation_order) from teams), 0) + 1
      where id = ${teamId} and presentation_order is null`);
  } else {
    await db.update(teams).set({ presentationOrder: null }).where(eq(teams.id, teamId));
  }
  refresh();
}

export async function setPresentationOrder(teamId: string, order: number | null) {
  await guard();
  await db
    .update(teams)
    .set({ presentationOrder: order && order > 0 ? Math.floor(order) : null })
    .where(eq(teams.id, teamId));
  refresh();
}

export type CheckInResult = { ok: true; team: CheckInTeam } | { ok: false; error: string };

/** Desk scanner: verify a scanned pass QR and load the team's member checklist. */
export async function lookupPass(scanned: string): Promise<CheckInResult> {
  await guard();
  const pass = parsePassQr(scanned);
  if (!pass) return { ok: false, error: "This QR code isn't a Paper-a-thon team pass." };
  if (!safeEqual(pass.sig, passSignature(pass.id))) return { ok: false, error: "This pass failed verification. It may be forged or edited." };
  const team = await getTeam(pass.id);
  if (!team) return { ok: false, error: `Team ${pass.id} no longer exists.` };
  return { ok: true, team: toCheckInTeam(team) };
}

/** Manual fallback when a pass can't be scanned: look a team up by its ID. */
export async function lookupTeamById(rawId: string): Promise<CheckInResult> {
  await guard();
  const digits = rawId.trim().toUpperCase().replace(/^PAT-?/, "").replace(/\D/g, "");
  if (!digits) return { ok: false, error: "Enter a team ID like PAT-007." };
  const id = `PAT-${digits.padStart(3, "0")}`;
  const team = await getTeam(id);
  if (!team) return { ok: false, error: `No team with ID ${id}.` };
  return { ok: true, team: toCheckInTeam(team) };
}

/**
 * Save which members are present. Members already checked in keep their original time;
 * the team counts as checked in only once every member is present.
 */
export async function saveCheckIn(teamId: string, present: boolean[]): Promise<CheckInResult> {
  await guard();
  const team = await getTeam(teamId);
  if (!team) return { ok: false, error: "Team not found." };
  const now = new Date().toISOString();
  const members = team.members.map((m, i) => ({ ...m, checkedInAt: present[i] ? (m.checkedInAt ?? now) : null }));
  const all = members.length > 0 && members.every((m) => m.checkedInAt);
  await db
    .update(teams)
    .set({ members, checkedIn: all, checkedInAt: all ? (team.checkedInAt ?? new Date()) : null })
    .where(eq(teams.id, teamId));
  refresh();
  return { ok: true, team: toCheckInTeam({ ...team, members }) };
}

export async function updateSetting(key: keyof Settings, value: boolean) {
  await guard();
  await setSetting(key, value);
  refresh();
}

export async function deleteTeam(teamId: string) {
  await guard();
  await db.delete(teams).where(eq(teams.id, teamId));
  refresh();
}

const TeamInput = z.object({
  name: z.string().trim().min(1).max(80),
  track: z
    .string()
    .nullish()
    .transform((v, ctx) => {
      const track = matchTrack(v);
      if (!track) {
        ctx.addIssue({ code: "custom", message: v?.trim() ? `Unknown track "${v.trim()}". Use one of the three event tracks.` : "Track is missing." });
        return z.NEVER;
      }
      return track;
    }),
  leaderEmail: z.string().trim().toLowerCase().email(),
  members: z.array(z.string().trim().min(1)).max(8),
});

async function nextIds(count: number) {
  const rows = await db.select({ id: teams.id }).from(teams);
  let max = 0;
  for (const r of rows) {
    const n = Number(r.id.replace(/^PAT-/, ""));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return Array.from({ length: count }, (_, i) => `PAT-${String(max + i + 1).padStart(3, "0")}`);
}

function toMembers(names: string[]): Member[] {
  return names.map((name, i) => ({ name, leader: i === 0 }));
}

export type FormResult = { error?: string; message?: string } | undefined;

export async function addTeam(_prev: FormResult, form: FormData): Promise<FormResult> {
  await guard();
  const parsed = TeamInput.safeParse({
    name: form.get("name"),
    track: form.get("track"),
    leaderEmail: form.get("leaderEmail"),
    members: String(form.get("members") ?? "")
      .split(/[\n;,]/)
      .map((s) => s.trim())
      .filter(Boolean),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const [id] = await nextIds(1);
  await db.insert(teams).values({
    id,
    name: parsed.data.name,
    track: parsed.data.track,
    leaderEmail: parsed.data.leaderEmail,
    members: toMembers(parsed.data.members),
    status: "paper_submitted", // PPT already submitted via the Google Form
  });
  refresh();
  return { message: `Added ${parsed.data.name} as ${id}.` };
}

/**
 * CSV columns (header row required, order doesn't matter):
 *   team_name, track, leader_email, members
 * `members` is a ";"-separated list, team lead first. Extra columns are ignored.
 */
export async function importTeams(_prev: FormResult, form: FormData): Promise<FormResult> {
  await guard();
  const file = form.get("file");
  const text = file instanceof File ? await file.text() : String(form.get("csv") ?? "");
  const rows = parseCsv(text);
  if (rows.length < 2) return { error: "CSV needs a header row and at least one team." };

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  const idx = { name: col("team_name"), track: col("track"), email: col("leader_email"), members: col("members") };
  if (idx.name < 0 || idx.email < 0) return { error: "Missing team_name or leader_email column." };

  const valid: z.infer<typeof TeamInput>[] = [];
  const errors: string[] = [];
  rows.slice(1).forEach((r, i) => {
    const parsed = TeamInput.safeParse({
      name: r[idx.name],
      track: idx.track >= 0 ? r[idx.track] : null,
      leaderEmail: r[idx.email],
      members: idx.members >= 0 ? (r[idx.members] ?? "").split(";").map((s) => s.trim()).filter(Boolean) : [],
    });
    if (parsed.success) valid.push(parsed.data);
    else errors.push(`Row ${i + 2}: ${parsed.error.issues[0].message}`);
  });

  if (valid.length) {
    const ids = await nextIds(valid.length);
    await db.insert(teams).values(
      valid.map((t, i) => ({ id: ids[i], name: t.name, track: t.track, leaderEmail: t.leaderEmail, members: toMembers(t.members), status: "paper_submitted" as const })),
    );
  }
  refresh();
  return {
    message: `Imported ${valid.length} team${valid.length === 1 ? "" : "s"}.`,
    error: errors.length ? errors.slice(0, 5).join(" · ") + (errors.length > 5 ? ` (+${errors.length - 5} more)` : "") : undefined,
  };
}

export async function addAnnouncement(_prev: FormResult, form: FormData): Promise<FormResult> {
  await guard();
  const message = String(form.get("message") ?? "").trim();
  if (!message) return { error: "Write something first." };
  await db.insert(announcements).values({ message: message.slice(0, 280) });
  refresh();
  return { message: "Posted." };
}

export async function deleteAnnouncement(id: number) {
  await guard();
  await db.delete(announcements).where(eq(announcements.id, id));
  refresh();
}
