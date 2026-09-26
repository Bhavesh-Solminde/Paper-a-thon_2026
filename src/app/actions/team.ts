"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, teams } from "@/lib/db";
import { getSettings, getTeam } from "@/lib/data";
import { getTeamSession } from "@/lib/auth";

const PaperSchema = z.object({
  title: z.string().trim().min(3, "Add your paper title.").max(200),
  url: z
    .string()
    .trim()
    .url("Paste a full link, starting with https://")
    .refine((u) => u.startsWith("https://"), "Link must start with https://"),
});

export type SubmitState = { error?: string; ok?: boolean } | undefined;

export async function submitPaper(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  const teamId = await getTeamSession();
  if (!teamId) return { error: "Your session expired. Log in again." };

  const team = await getTeam(teamId);
  if (!team) return { error: "Team not found." };

  const { submissionsOpen } = await getSettings();
  if (!submissionsOpen) return { error: "Submissions are closed." };
  if (team.status === "shortlisted" || team.status === "not_shortlisted") {
    return { error: "Your paper has already been reviewed." };
  }

  const parsed = PaperSchema.safeParse({ title: form.get("title"), url: form.get("url") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db
    .update(teams)
    .set({
      paperTitle: parsed.data.title,
      paperUrl: parsed.data.url,
      submittedAt: new Date(),
      status: "paper_submitted",
    })
    .where(eq(teams.id, teamId));

  revalidatePath("/dashboard");
  return { ok: true };
}
