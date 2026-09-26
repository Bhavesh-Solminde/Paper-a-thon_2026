"use server";

import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, otpCodes } from "@/lib/db";
import { getTeam } from "@/lib/data";
import {
  clearTeamSession,
  generateOtp,
  hashOtp,
  maskEmail,
  safeEqual,
  setTeamSession,
} from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;

export type OtpRequestResult =
  | { ok: true; maskedEmail: string; cooldown: number }
  | { ok: false; error: string; retryIn?: number };

export async function requestOtp(teamId: string): Promise<OtpRequestResult> {
  const team = await getTeam(teamId);
  if (!team) return { ok: false, error: "Team not found." };

  const recent = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.teamId, teamId), gt(otpCodes.createdAt, new Date(Date.now() - 60 * 60 * 1000))))
    .orderBy(desc(otpCodes.createdAt));

  if (recent[0]) {
    const since = Date.now() - recent[0].createdAt.getTime();
    if (since < RESEND_COOLDOWN_MS) {
      const retryIn = Math.ceil((RESEND_COOLDOWN_MS - since) / 1000);
      return { ok: false, error: `Please wait ${retryIn}s before requesting another code.`, retryIn };
    }
  }
  if (recent.length >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: "Too many codes requested. Try again in an hour or contact the organisers." };
  }

  const code = generateOtp();
  // Invalidate older codes so only the latest one works.
  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpCodes.teamId, teamId), isNull(otpCodes.consumedAt)));
  await db.insert(otpCodes).values({
    teamId,
    codeHash: hashOtp(teamId, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  try {
    await sendOtpEmail(team.leaderEmail, team.name, code);
  } catch (e) {
    console.error("OTP email failed", e);
    return { ok: false, error: "We couldn't send the email. Please try again in a minute." };
  }

  return { ok: true, maskedEmail: maskEmail(team.leaderEmail), cooldown: RESEND_COOLDOWN_MS / 1000 };
}

export type OtpVerifyResult = { ok: false; error: string } | undefined;

export async function verifyOtp(teamId: string, code: string): Promise<OtpVerifyResult> {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) return { ok: false, error: "Enter the 6-digit code." };

  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.teamId, teamId), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This code has expired. Request a new one." };
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts. Request a new code." };
  }

  if (!safeEqual(otp.codeHash, hashOtp(teamId, clean))) {
    await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
    const left = MAX_ATTEMPTS - otp.attempts - 1;
    return { ok: false, error: left > 0 ? `Wrong code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Request a new code." };
  }

  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));
  await setTeamSession(teamId);
  redirect("/dashboard");
}

export async function logout() {
  await clearTeamSession();
  redirect("/");
}
