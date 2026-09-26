import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { announcements, db, settings, teams, type Team, type TeamStatus } from "./db";
import { EVENT } from "./event";

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
  if (!resultsPublished) return "under_review";
  return team.status === "shortlisted" ? "shortlisted" : "not_shortlisted";
}

export const STATUS_LABEL: Record<PublicStatus, string> = {
  registered: "Registered",
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
    .orderBy(asc(teams.presentationOrder), asc(teams.name));
  return rows;
}

export async function listAnnouncements(limit = 10) {
  return db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(limit);
}

// Presentation slots: 10 min each, Session I 09:40–13:30, Session II 14:00–17:00.
const SLOT = EVENT.slotMinutes.presentation + EVENT.slotMinutes.qna;
const SESSIONS = [
  { start: 9 * 60 + 40, end: 13 * 60 + 30, label: "Session I" },
  { start: 14 * 60, end: 17 * 60, label: "Session II" },
];

export function slotFor(order: number | null | undefined) {
  if (!order || order < 1) return null;
  let remaining = order - 1;
  for (const s of SESSIONS) {
    const capacity = Math.floor((s.end - s.start) / SLOT);
    if (remaining < capacity) {
      const start = s.start + remaining * SLOT;
      return { session: s.label, start: fmt(start), end: fmt(start + SLOT) };
    }
    remaining -= capacity;
  }
  return null; // beyond capacity — organisers will announce
}

function fmt(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
