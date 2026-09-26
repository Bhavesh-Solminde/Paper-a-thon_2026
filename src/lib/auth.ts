import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const TEAM_COOKIE = "pat_team";
const ADMIN_COOKIE = "pat_admin";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set (16+ chars)");
  return s;
}
const key = () => new TextEncoder().encode(secret());

export function hmac(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(teamId: string, code: string) {
  return hmac(`otp:${teamId}:${code}`);
}

/** Signature embedded in QR passes so a pass link can't be forged for another team. */
export function passSignature(teamId: string) {
  return hmac(`pass:${teamId}`).slice(0, 16);
}

async function sign(payload: Record<string, unknown>, ttl: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(key());
}

async function read(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload;
  } catch {
    return null;
  }
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setTeamSession(teamId: string) {
  const token = await sign({ sub: teamId, role: "team" }, "7d");
  (await cookies()).set(TEAM_COOKIE, token, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });
}

export async function getTeamSession() {
  const payload = await read((await cookies()).get(TEAM_COOKIE)?.value);
  return payload?.role === "team" && typeof payload.sub === "string" ? payload.sub : null;
}

export async function clearTeamSession() {
  (await cookies()).delete(TEAM_COOKIE);
}

export async function setAdminSession() {
  const token = await sign({ role: "admin" }, "12h");
  (await cookies()).set(ADMIN_COOKIE, token, { ...cookieOpts, maxAge: 60 * 60 * 12 });
}

export async function isAdmin() {
  const payload = await read((await cookies()).get(ADMIN_COOKIE)?.value);
  return payload?.role === "admin";
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"•".repeat(Math.max(3, user.length - visible.length))}@${domain}`;
}
