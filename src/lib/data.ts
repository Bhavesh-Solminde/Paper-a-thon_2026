import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { announcements, db, settings, teams, type Team, type TeamStatus } from "./db";

export type Settings = { resultsPublished: boolean };

const DEFAULT_SETTINGS: Settings = { resultsPublished: false };

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(settings);
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.key in out) (out as Record<string, unknown>)[r.key] = r.value;
  }
  return out;
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

/** What the outside world (and the team itself) should see, given whether results are out. */
export type PublicStatus = TeamStatus | "under_review";

// PPTs were submitted through the Google Form, so every team is under review until results are
// published — then each team is either shortlisted or not.
export function visibleStatus(team: Pick<Team, "status">, resultsPublished: boolean): PublicStatus {
  // Registered but never submitted a PPT: not part of the shortlisting at all.
  if (team.status === "registered") return "registered";
  if (!resultsPublished) return "under_review";
  return team.status === "shortlisted" ? "shortlisted" : "not_shortlisted";
}

export const STATUS_LABEL: Record<PublicStatus, string> = {
  registered: "No PPT submitted",
  paper_submitted: "PPT Submitted",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  not_shortlisted: "Not Shortlisted",
};

export async function listTeamsForLogin() {
  return db
    .select({ id: teams.id, name: teams.name, track: teams.track })
    .from(teams)
    .orderBy(asc(teams.name));
}

export async function getTeam(id: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return team ?? null;
}

export async function listAllTeams() {
  return db.select().from(teams).orderBy(asc(teams.id));
}

export async function listShortlisted() {
  const rows = await db
    .select()
    .from(teams)
    .where(eq(teams.status, "shortlisted"))
    .orderBy(asc(teams.name)); // alphabetical: the running order stays with the organisers
  return rows;
}

export async function listAnnouncements(limit = 10) {
  return db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(limit);
}
