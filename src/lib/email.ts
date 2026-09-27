import "server-only";
import { Resend } from "resend";
import { EVENT } from "./event";

const OTP_MINUTES = 10;

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
    ...otpEmail(teamName, code),
  });
  if (error) throw new Error(error.message);
}

/**
 * Login-code email. Follows the conventions of well-run transactional mail (Linear, Stripe, Vercel):
 * code-first subject and inbox preview, one column, one job, the code as real selectable text,
 * expiry and a "didn't ask for this?" line, then a quiet footer. Tables and inline styles only,
 * so it renders the same in Gmail, Outlook and Apple Mail.
 */
export function otpEmail(teamName: string, code: string) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const host = site.replace(/^https?:\/\//, "");
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const team = esc(teamName);
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const mono = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";
  const preview = `Your code is ${code}. It expires in ${OTP_MINUTES} minutes.`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Your ${esc(EVENT.name)} login code</title>
<style>
  @media (max-width: 480px) { .card { padding:32px 24px !important; } }
  @media (prefers-color-scheme: dark) {
    .bg { background:#0b0c0f !important; }
    .card { background:#15171c !important; border-color:#262a33 !important; }
    .fg { color:#ecebe4 !important; }
    .muted { color:#9aa0aa !important; }
    .code { background:#1f222a !important; color:#ffffff !important; border-color:#2f3440 !important; }
    .rule { border-color:#262a33 !important; }
  }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:#f4f4f5;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${preview}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" class="bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5">
  <tr><td align="center" style="padding:40px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px">
      <tr><td class="card" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:40px 36px;font-family:${font}">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:12px;vertical-align:middle"><img src="${site}/email/mlsc-badge.png" width="40" height="44" alt="MLSC" style="display:block;border:0"></td>
          <td style="vertical-align:middle">
            <div class="fg" style="font-size:15px;font-weight:700;color:#0b0c0f;letter-spacing:-0.1px">${esc(EVENT.name)} 2026</div>
            <div class="muted" style="font-size:12px;color:#71717a;margin-top:2px">${esc(EVENT.club)}</div>
          </td>
        </tr></table>

        <h1 class="fg" style="margin:32px 0 0;font-size:22px;line-height:1.3;font-weight:700;color:#0b0c0f;letter-spacing:-0.2px">Your login code</h1>
        <p class="muted" style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#52525b">Enter this code on the ${esc(EVENT.name)} site to sign in to <strong class="fg" style="color:#0b0c0f;font-weight:600">${team}</strong>.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0"><tr>
          <td class="code" align="center" style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:18px 12px 18px 20px;font-family:${mono};font-size:32px;line-height:1;font-weight:700;letter-spacing:8px;color:#0b0c0f">${code}</td>
        </tr></table>

        <p class="muted" style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#52525b">This code expires in ${OTP_MINUTES} minutes and works once. Don't share it with anyone; the organisers will never ask you for it.</p>

        <hr class="rule" style="border:0;border-top:1px solid #e4e4e7;margin:28px 0">

        <p class="muted" style="margin:0;font-size:13px;line-height:1.6;color:#71717a">Didn't request this? You can safely ignore this email. Nobody can sign in without the code.</p>
      </td></tr>
      <tr><td style="padding:24px 8px 0;font-family:${font};font-size:12px;line-height:1.7;color:#a1a1aa;text-align:center">
        ${esc(EVENT.dateLabel)} 2026 · ${esc(EVENT.venue)}<br>
        <a href="${site}" style="color:#a1a1aa;text-decoration:underline">${esc(host)}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `Your ${EVENT.name} login code`,
    "",
    `Enter this code to sign in to ${teamName}:`,
    "",
    `    ${code}`,
    "",
    `It expires in ${OTP_MINUTES} minutes and works once. Don't share it with anyone; the organisers will never ask you for it.`,
    "",
    "Didn't request this? You can safely ignore this email.",
    "",
    "--",
    `${EVENT.name} 2026 · ${EVENT.club}`,
    `${EVENT.dateLabel} 2026 · ${EVENT.venue}`,
    site,
  ].join("\n");

  return { subject: `${code} is your ${EVENT.name} login code`, html, text };
}
