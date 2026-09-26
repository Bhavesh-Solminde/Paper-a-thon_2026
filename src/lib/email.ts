import "server-only";
import { Resend } from "resend";
import { EVENT } from "./event";

export async function sendOtpEmail(to: string, teamName: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.log(`\n[dev] OTP for ${teamName} <${to}>: ${code}\n`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || "Paper-a-thon <onboarding@resend.dev>",
    to,
    subject: `${code} is your ${EVENT.name} login code`,
    text: `Your ${EVENT.name} login code for team "${teamName}" is ${code}.\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: otpHtml(teamName, code),
  });
  if (error) throw new Error(error.message);
}

function otpHtml(teamName: string, code: string) {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return `<!doctype html><html><body style="margin:0;background:#07080b;font-family:Arial,Helvetica,sans-serif;color:#ecebe4">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#0e1016;border:1px solid #1f2533;border-radius:16px;padding:32px">
      <tr><td style="font-size:12px;letter-spacing:4px;color:#3d8bff;text-transform:uppercase">${EVENT.club}</td></tr>
      <tr><td style="font-size:30px;font-weight:900;padding:8px 0 20px;letter-spacing:1px">PAPER-A-THON</td></tr>
      <tr><td style="font-size:15px;line-height:1.6;color:#b9bcc4">Here's the login code for team <b style="color:#ecebe4">${esc(teamName)}</b>:</td></tr>
      <tr><td style="padding:20px 0"><div style="background:#ecebe4;color:#07080b;font-size:36px;font-weight:900;letter-spacing:10px;text-align:center;padding:16px;border-radius:10px">${code}</div></td></tr>
      <tr><td style="font-size:13px;color:#8a8f98">Expires in 10 minutes. If you didn't request this, you can ignore this email.</td></tr>
      <tr><td style="font-size:12px;color:#5b6070;padding-top:24px">${EVENT.dateLabel} · ${EVENT.venue} · ${EVENT.hashtags.join(" ")}</td></tr>
    </table>
  </td></tr></table></body></html>`;
}
