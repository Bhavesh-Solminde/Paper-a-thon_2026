import "server-only";
import type { Team } from "./db";
import { passSignature } from "./auth";
import { STATUS_LABEL, slotFor, visibleStatus } from "./data";

export function passUrl(teamId: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/pass/${teamId}?s=${passSignature(teamId)}`;
}

/** Everything a team's QR pass needs, computed on the server. */
export function passData(team: Team, resultsPublished: boolean) {
  const status = visibleStatus(team, resultsPublished);
  const slot = status === "shortlisted" ? slotFor(team.presentationOrder) : null;
  const url = passUrl(team.id);
  // QR content is kept short so it scans fast at the desk: the team's identity plus a signed link.
  // Opening the link (any phone camera) shows the full verified pass: members, track, status and slot.
  const qrText = `${team.id} · ${team.name}\n${url}`;
  return {
    id: team.id,
    name: team.name,
    track: team.track,
    members: team.members.map((m) => m.name),
    status: STATUS_LABEL[status],
    slot: slot ? `${slot.start} · ${slot.session}` : null,
    url,
    qrText,
  };
}

export type PassData = ReturnType<typeof passData>;
