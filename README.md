# Paper-a-thon 2026 · MLSC

Event site for **Paper-a-thon** by the Microsoft Learn Students Club. It covers the landing page, the event-day flow, team login by email code, team dashboards with QR passes, a public shortlist board and an organiser console.

**Stack:** Next.js 16 (App Router), Tailwind CSS v4, GSAP + ScrollTrigger, Motion, Lenis, Drizzle ORM + Postgres, Resend.

## User flow

```
Landing (/)  ──►  Team Login (/login)  ──►  pick team  ──►  6-digit code emailed to team lead (Resend)
                                                        ──►  enter code  ──►  Team Dashboard (/dashboard)
Dashboard: profile card (name · members · track · status) → progress tracker → submit paper link
           → result (Shortlisted 🎉 + slot / "Better luck next time!") → download QR pass
Public:    /shortlisted — every shortlisted team, members, track, presentation slot
Organisers:/admin — import teams, shortlist/reject, publish results, announcements, check-in
Desk:      scan QR → /pass/PAT-xxx?s=… (signed) → verify team → "Check in" (when logged in as admin)
```

**Team status lifecycle**

| Status | How it's set |
| --- | --- |
| Registered | Team is added or imported by organisers |
| Paper Submitted | Set automatically when the team submits a paper link from their dashboard |
| Under Review | What teams see after the organisers mark them, until results are published |
| Shortlisted / Not Shortlisted | Set in `/admin`, revealed to everyone when **Publish results** is switched on |

Shortlisted teams get a presentation order automatically. Each slot is 7 min + 3 min, so it's 10 minutes: Session I runs 9:40–1:30 and Session II runs 2:00–5:00. Organisers can reorder with the `#` field in `/admin`.

## Local setup

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL, AUTH_SECRET, ADMIN_PASSWORD
npm run db:migrate                # create tables
npm run db:seed                   # optional: 8 demo teams
npm run dev
```

If `RESEND_API_KEY` is empty, login codes are printed in the dev server console instead of being emailed.

## Deploying (Vercel + Neon)

1. Create a free Postgres database on [Neon](https://neon.tech) (or Supabase) and copy the connection string.
2. Import this repo into [Vercel](https://vercel.com) and set these env vars: `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), `ADMIN_PASSWORD`, `RESEND_API_KEY`, `RESEND_FROM`, and `NEXT_PUBLIC_SITE_URL` (your live URL, which goes into the QR codes).
3. Run `DATABASE_URL=... npm run db:migrate` once against the production database.
4. **Resend:** verify your domain in Resend and use an address on it for `RESEND_FROM`. The sandbox sender `onboarding@resend.dev` only delivers to your own Resend account email.

## Loading registered teams

In `/admin` → **Bulk import (CSV)**. You need a header row. Column order doesn't matter, and `members` is separated by `;` with the lead first:

```csv
team_name,track,leader_email,members
Neural Nomads,AI & Machine Learning,lead@gmail.com,Aarav Shah;Isha Patil;Rohan Desai
```

A Google Forms export works once you rename its columns to these names. Teams get IDs `PAT-001`, `PAT-002`, … in order.

## Entry animation (Higgsfield)

The landing page opens with an entry animation, shown once per browser session. You can skip it, and it's disabled when the visitor has turned on reduced motion in their system settings:
- **Paper intro** (default): the MLSC badge, a stack of papers dropping in, "Read · Analyse · Think · Write · Repeat" flipping by, the title stamped on, then a glowing tear rips the screen open onto the site.
- **Higgsfield intro** (live): `public/intro/intro.webm` + `intro.mp4` + `poster.jpg` is a clip generated with Higgsfield. A Soul V2 keyframe was animated with DoP image-to-video. The MLSC badge and the real title are layered on top, then the screen tears away. If the clip can't play (for example, autoplay is blocked in iPhone Low Power Mode), it falls back to the paper intro. To regenerate it (each step costs one generation): `NODE_USE_ENV_PROXY=1 npm run intro:generate image`, check `poster.*`, then `npm run intro:generate video <imageUrl>` and compress it with the printed ffmpeg commands.

## Editing content

All event copy lives in **`src/lib/event.ts`**: dates, venue, tracks, the road-to-the-29th phases, the event-day schedule and the FAQ. The landing page, dashboard and emails all read from it.

## Security notes

- Login codes are HMAC-hashed, expire after 10 min, allow 5 attempts and have a 60 s resend cooldown (max 5 per hour).
- Sessions are signed, httpOnly JWT cookies. Admin access uses `ADMIN_PASSWORD`.
- QR pass links carry an HMAC signature, so a pass can't be forged for another team.
