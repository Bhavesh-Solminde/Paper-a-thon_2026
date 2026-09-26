import type { Member, Team } from "./db/schema";

export type Attendance = { here: number; total: number; state: "absent" | "pending" | "present" };

/** A team is Present only when every member has been checked in; otherwise Pending (some) or Absent (none). */
export function attendance(members: Pick<Member, "checkedInAt">[]): Attendance {
  const total = members.length;
  const here = members.filter((m) => m.checkedInAt).length;
  return { here, total, state: here === 0 ? "absent" : here < total ? "pending" : "present" };
}

/** What the desk check-in sheet needs about a team. */
export type CheckInTeam = {
  id: string;
  name: string;
  track: string;
  shortlisted: boolean;
  members: { name: string; leader: boolean; checkedInAt: string | null }[];
};

export function toCheckInTeam(team: Team): CheckInTeam {
  return {
    id: team.id,
    name: team.name,
    track: team.track,
    shortlisted: team.status === "shortlisted",
    members: team.members.map((m) => ({ name: m.name, leader: !!m.leader, checkedInAt: m.checkedInAt ?? null })),
  };
}

/** Pulls the team ID and signature out of a scanned QR (the pass embeds …/pass/PAT-007?s=<sig>). */
export function parsePassQr(text: string): { id: string; sig: string } | null {
  const m = text.match(/\/pass\/(PAT-\d+)\?s=([A-Za-z0-9_-]+)/);
  return m ? { id: m[1], sig: m[2] } : null;
}
