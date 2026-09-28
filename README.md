# Paper-a-thon 2026 · MLSC

Event site for **Paper-a-thon** by the Microsoft Learn Students Club. It covers the landing page, the event-day flow, team login by email code, team dashboards with QR passes, a public shortlist board and an organiser console.

**Stack:** Next.js 16 (App Router), Tailwind CSS v4, GSAP + ScrollTrigger, Motion, Lenis, Drizzle ORM + Postgres, Resend.

## User flow

PPT submissions were collected through a Google Form, so the site handles everything after that: results, event day and check-in.

```
Landing (/)  ──►  Team Login (/login)  ──►  pick team  ──►  6-digit code emailed to team lead (Resend)
                                                        ──►  enter code  ──►  Team Dashboard (/dashboard)
Dashboard: profile card (name · members · track · status) → progress tracker → PPT received
           → result (Shortlisted 🎉 / "Better luck next time!") → download QR pass
Public:    /shortlisted — every shortlisted team, members, track (alphabetical, no running order)
Organisers:/admin — import teams, mark shortlisted, publish results, announcements, check-in
Desk:      /admin → Scan QR (built-in camera scanner) → verified team → tick members present
```

**What teams see**

| Before results are published | After **Publish results** in `/admin` |
| --- | --- |
| Under Review (PPT received via the Google Form) | **Shortlisted**, with their QR pass, if marked in `/admin` |
| | **Not Shortlisted** ("Better luck next time!") for every other team |

Organisers only mark the shortlisted teams; everyone else is automatically "not shortlisted" when results go live.
Teams present for 7 min + 3 min Q&A. Presentation slots are never shown to teams: the running order is kept by the organisers (the `#` field in `/admin` is for your own use) and announced on the day.

## Event-day check-in (desk)

1. The desk volunteer logs in to `/admin` on a phone and keeps it open.
2. Tap **Scan QR** and point the camera at the team's pass (or type the team ID, e.g. `PAT-007`). The pass signature is verified, so forged or edited QR codes are rejected.
3. Tick the members who are present and save (or tap **Mark all present**). This doubles as attendance.
4. The team shows **Pending x/y** until every member is checked in, then **Present**. When a latecomer arrives, scan the pass again (or tap **Attendance** on the team's row) and tick them. Members already checked in keep their original time.

The QR only holds the team ID, name and a signed link, so it scans quickly. Opening the link with any phone camera shows the full verified pass.

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
Neural Nomads,"Generative AI Systems, LLMOps & Alignment",lead@gmail.com,Aarav Shah;Isha Patil;Rohan Desai
```

The three tracks are High-Performance Computing, Parallel Systems & Quantum Software; Zero Trust Security, Post-Quantum Cryptography & Privacy Tech; and Generative AI Systems, LLMOps & Alignment. Track names contain commas, so quote them in the CSV. Short forms like `HPC`, `Zero Trust`, `PQC` or `GenAI` are also recognised, and a row with an unknown track is rejected with a message. A Google Forms export works once you rename its columns to these names. Teams get IDs `PAT-001`, `PAT-002`, … in order.

## Entry animation (Higgsfield)

The landing page opens with an entry animation, shown once per browser session. You can skip it, and it's disabled when the visitor has turned on reduced motion in their system settings:
- **Paper intro** (default): the MLSC badge, a stack of papers dropping in, "Read · Analyse · Think · Write · Repeat" flipping by, the title stamped on, then a glowing tear rips the screen open onto the site.
- **Higgsfield intro** (live, desktop/tablet only; phones skip the entrance and never download it): `public/intro/intro-hd.mp4` (the original Higgsfield master, remuxed for fast start) + `poster.jpg` is "Paper storm", a vortex of research pages that the camera flies into. It was made from a Higgsfield Soul V2 keyframe animated with DoP (`dop-preview`). The MLSC badge and the real title are layered on top, then the site opens outward from the vortex's eye. If the clip can't play (for example, autoplay is blocked in iPhone Low Power Mode), it falls back to the paper-tear intro. To regenerate it (each step costs one generation): `NODE_USE_ENV_PROXY=1 npm run intro:generate image storm`, check the keyframe, then `HF_VIDEO_MODEL=dop-preview npm run intro:generate video <imageUrl> storm`, and compress it with the printed ffmpeg commands. There's also an `ink` concept.

## Editing content

All event copy lives in **`src/lib/event.ts`**: dates, venue, tracks, the road-to-the-29th phases, the event-day schedule and the FAQ. The landing page, dashboard and emails all read from it.

## Security notes

- Login codes are HMAC-hashed, expire after 10 min, allow 5 attempts and have a 60 s resend cooldown (max 5 per hour).
- Sessions are signed, httpOnly JWT cookies. Admin access uses `ADMIN_PASSWORD`.
- QR pass links carry an HMAC signature, so a pass can't be forged for another team.
