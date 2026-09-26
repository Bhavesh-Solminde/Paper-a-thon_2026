import "server-only";
import type { Team } from "./db";
import { passSignature } from "./auth";
import { STATUS_LABEL, slotFor, visibleStatus } from "./data";
import { EVENT } from "./event";

export function passUrl(teamId: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/pass/${teamId}?s=${passSignature(teamId)}`;
}

/** Everything a team's QR pass needs, computed on the server. */
export function passData(team: Team, resultsPublished: boolean) {
  const status = visibleStatus(team, resultsPublished);
  const slot = status === "shortlisted" ? slotFor(team.presentationOrder) : null;
  const url = passUrl(team.id);
  // QR content: readable by any scanner app, plus a signed link volunteers open to verify & check in.
  const qrText = [
    `PAPER-A-THON 2026 · ${EVENT.dateLabel}`,
    `Team: ${team.name} (${team.id})`,
    `Track: ${team.track}`,
    `Members: ${team.members.map((m) => m.name).join(", ")}`,
    `Status: ${STATUS_LABEL[status]}`,
    slot ? `Slot: ${slot.start} (${slot.session})` : null,
    `Verify: ${url}`,
  ]
    .filter(Boolean)
    .join("\n");
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
