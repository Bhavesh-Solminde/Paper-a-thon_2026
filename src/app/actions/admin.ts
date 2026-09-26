"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { announcements, db, teams, type Member, type TeamStatus } from "@/lib/db";
import { setSetting, type Settings } from "@/lib/data";
import { clearAdminSession, isAdmin, safeEqual, setAdminSession } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";

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

export async function toggleCheckIn(teamId: string, checkedIn: boolean) {
  await guard();
  await db
    .update(teams)
    .set({ checkedIn, checkedInAt: checkedIn ? new Date() : null })
    .where(eq(teams.id, teamId));
  refresh();
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
  track: z.string().trim().min(1).max(80),
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
      track: idx.track >= 0 ? r[idx.track] || "Open Innovation" : "Open Innovation",
      leaderEmail: r[idx.email],
      members: idx.members >= 0 ? (r[idx.members] ?? "").split(";").map((s) => s.trim()).filter(Boolean) : [],
    });
    if (parsed.success) valid.push(parsed.data);
    else errors.push(`Row ${i + 2}: ${parsed.error.issues[0].message}`);
  });

  if (valid.length) {
    const ids = await nextIds(valid.length);
    await db.insert(teams).values(
      valid.map((t, i) => ({ id: ids[i], name: t.name, track: t.track, leaderEmail: t.leaderEmail, members: toMembers(t.members) })),
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
