# Auryx Software — Website, Booking, AI Assistant & Admin

*The Silent Force Behind Smarter Software.*

The official Auryx Software website: a corporate site with lead generation (contact inquiries), Google Calendar consultation booking, a lightweight AI chat assistant that uses only approved knowledge, and a single-admin dashboard/CMS. It was built from the approved **Auryx Website Business Analysis Document**.

---

## Contents

1. [Overview](#overview)
2. [Architecture & tech stack](#architecture--tech-stack)
3. [Local setup](#local-setup)
4. [Environment variables](#environment-variables)
5. [Database](#database)
6. [Admin & authentication](#admin--authentication)
7. [Email setup](#email-setup)
8. [Google Calendar setup](#google-calendar-setup)
9. [AI provider setup](#ai-provider-setup)
10. [Data retention](#data-retention)
11. [Deployment](#deployment)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)
14. [Decisions, assumptions & items for Auryx review](#decisions-assumptions--items-for-auryx-review)
15. [Known limitations](#known-limitations)

---

## Overview

| Area | What it does |
|---|---|
| **Public site** | Home, About, Services (+ one page per service), Case Studies (+ detail pages), Contact, Book a Consultation, Privacy Notice |
| **Contact** | Name/nickname + message (required), email + contact number (optional), required Privacy Notice acknowledgment, spam protection. Each inquiry is stored (status **New**) and emailed to `info@auryx.net`. |
| **Booking** | Mon–Fri, 8:00 AM–5:00 PM Philippine time. Visitors pick a free slot, and the booking creates a Google Calendar event with Knut, Mich and the visitor as attendees. The visitor gets a confirmation email with a private link to reschedule or cancel. |
| **AI assistant** | Bottom-right chat widget. It answers only from admin-approved knowledge and routes visitors to Contact or Booking. It shows a privacy disclosure and stores conversations (6 months by default). |
| **Admin** | Dashboard, contact inquiries (status: New / Contacted / In Progress / Closed, search/filter), consultations, Home/About/Privacy content, services, case studies (with image uploads), chatbot knowledge, conversations (Open / Reviewed / Resolved, lead flag, search/filter), settings, MFA. |

The user journey from the BA is: understand Auryx → explore services and case studies → ask the assistant → send a message or book → Auryx manages the lead in Admin.

## Architecture & tech stack

This is a **single Next.js application** (a modular monolith). There are no microservices, queues or extra infrastructure.

```
Browser ──► Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS 4)
             ├─ Public pages (server-rendered from the DB)
             ├─ Route handlers  /api/contact · /api/booking/* · /api/chat · /api/cron/retention · /media/[id]
             ├─ Admin (/admin/*) — server components + server actions, protected by proxy.ts + requireAdmin()
             └─ src/lib — domain modules
                  ├─ db/          Drizzle ORM schema + client (PostgreSQL, or embedded PGlite locally)
                  ├─ auth.ts      bcrypt passwords, signed httpOnly session cookie, TOTP MFA, lockout
                  ├─ booking/     slot rules (pure) · Google Calendar adapter · booking service
                  ├─ chatbot/     knowledge loader · provider adapters · FAQ fallback · engine
                  ├─ email.ts     SMTP / console adapter
                  ├─ retention.ts scheduled purge
                  └─ security.ts  rate limiting, origin checks, encryption helpers
```

- **Database:** PostgreSQL through Drizzle ORM. Locally it uses **PGlite** (Postgres compiled to WASM), so no Docker or Postgres install is needed.
- **Images:** uploaded images are stored in the database and served from `/media/<id>` through Next.js image optimization. Nothing depends on the filesystem or an extra storage service, so the site runs on serverless or VM hosting.
- **Integrations are adapters.** Email (`src/lib/email.ts`), calendar (`src/lib/booking/calendar.ts`) and AI (`src/lib/chatbot/providers.ts`) can each be swapped without touching the rest of the app.

## Local setup

Requirements: **Node.js 20.9+** (22 LTS recommended). Nothing else is needed.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Edit `.env.local`. For local development you can leave almost everything empty:

```bash
npm run db:seed
```

This creates the local database in `.data/` and loads the approved initial content.

```bash
npm run admin:create
```

The script asks for the admin **username** (an email address, e.g. `accounts@auryx.net`) and a password (at least 10 characters, including a letter and a number).

```bash
npm run dev
```

Open http://localhost:3000 for the website.

**To open the Admin Dashboard:**
1. Go to http://localhost:3000/admin. You'll be redirected to the sign-in page.
2. Enter the admin username and password.
3. To change the password, go to **Settings → Account & password**. The username can't be changed there. To use a different username, run `npm run admin:create` again with the new one.

With nothing configured, email is logged to the console, bookings are saved without calendar events, and the assistant answers from the approved FAQs. The dashboard's **System status** panel shows which integrations are active.

> PGlite is single-process. Stop `npm run dev` before running `db:seed` or `admin:create` against the local database.

## Environment variables

All variables are documented in [`.env.example`](.env.example). Secrets are read **only on the server**. The only `NEXT_PUBLIC_` variable is the public site URL.

| Variable | Required in prod | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public base URL used for email links, the sitemap and OG tags. **Set it at build time**, because Next.js inlines it. |
| `DATABASE_URL` | ✅ | PostgreSQL connection string. Leave unset locally to use PGlite. |
| `DATABASE_SSL`, `DATABASE_POOL_MAX` | – | TLS toggle and pool size |
| `AUTH_SECRET` | ✅ | ≥32 random chars. Signs admin sessions and encrypts MFA secrets. The app refuses to run in production without it. |
| `EMAIL_TRANSPORT`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | ✅ | Outgoing email |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` | ✅ | Consultation calendar |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` | optional | Chat assistant model. Without a key, the FAQ-only mode is used. |
| `CRON_SECRET` | ✅ | Protects the daily retention job |

Never commit `.env*` files with real values. `.gitignore` already excludes them.

## Database

- The schema is in `src/lib/db/schema.ts`, and the SQL migrations are in `drizzle/`.

| Table | Purpose |
|---|---|
| `admin_users` | Single admin level: bcrypt hash, encrypted TOTP secret, session version, lockout |
| `audit_log` | Important admin actions (who, what, when) |
| `site_content` | Editable JSON documents (home, about, site, privacy, booking/retention/chatbot settings) with a `needs_review` flag |
| `services`, `case_studies`, `case_study_images`, `images` | Content and uploaded images |
| `inquiries` | Contact submissions, status, internal notes, privacy-notice version acknowledged, email delivery result |
| `bookings` | Consultations, Google event ID, hashed manage token, privacy acknowledgment |
| `knowledge_entries` | Admin-managed chatbot knowledge (enable/disable) |
| `chat_conversations`, `chat_messages` | Stored conversations, status, lead flag |
| `rate_limits` | DB-backed fixed-window rate limiting, so it works across serverless instances |

**Commands**

- `npm run db:generate` creates a new migration after you change `schema.ts`.
- `npm run db:migrate` applies migrations to the database in `DATABASE_URL`. PGlite migrates automatically.
- `npm run db:seed` inserts the initial approved content. It never overwrites existing records.

**Backups:** use your Postgres provider's automated backups and point-in-time recovery (e.g. Neon/Supabase), or schedule `pg_dump` on a VPS. Uploaded images live in the database, so they're included.

## Admin & authentication

- There is **one admin access level**, as the BA requires. There are no role hierarchies.
- **Create or reset the admin** with `npm run admin:create`, run on a machine that can reach the production DB. For non-interactive setups you can set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for that single command, and never store them anywhere. On an existing account this resets the password, clears MFA and signs out all sessions. This is the account-recovery path.
- **Passwords** are stored as bcrypt hashes (cost 12). They are never stored in plaintext, and no password is ever committed to this repository.
- **Password rule:** at least 10 characters, including a letter and a number.
- **Sessions** use a signed (HS256) httpOnly, `SameSite=Lax`, `Secure` cookie that lasts 8 hours. Sessions are re-validated against the database on every admin request, so a password change or **Sign out everywhere** revokes them immediately.
- **MFA:** TOTP authenticator apps are supported (Settings → Two-factor authentication). **Enable it for production.**
- **Brute-force protection:** 10 login attempts per 15 minutes per IP. The account locks for 15 minutes after 5 failures.
- **Authorization:** access is enforced in three places: `src/proxy.ts` (first gate), `requireAdmin()` in every admin page, and `requireAdmin()` in every server action.

## Email setup

These emails are sent:
- **Contact inquiry** → the address set in Admin → Pages → General (default `info@auryx.net`). Reply-To is set to the visitor.
- **Booking created / rescheduled / cancelled** → the visitor, plus the booking notification recipients (default `knut.bentzrod@auryx.net`, `mich.sergio@auryx.net`).

**Google Workspace (recommended):**
1. Pick a sending account (e.g. `info@auryx.net`). Enable 2-Step Verification and create an **App Password**.
2. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=info@auryx.net`, `SMTP_PASSWORD=<app password>`, `EMAIL_FROM="Auryx Software <info@auryx.net>"`.
3. Alternatively, use Workspace **SMTP relay** (`smtp-relay.gmail.com`) with IP allow-listing, or any transactional SMTP provider.
4. Add SPF/DKIM/DMARC for `auryx.net` so messages aren't marked as spam.

If sending fails, the inquiry is **still saved**. The dashboard marks it "⚠ email" so nothing is lost.

## Google Calendar setup

The app books into one calendar through the Google Calendar API, using an OAuth refresh token for the Workspace account that owns that calendar.

1. In **Google Cloud Console**, create a project and enable the **Google Calendar API**.
2. Configure the **OAuth consent screen** as *Internal* (Workspace).
3. Create an **OAuth client ID** of type *Web application*. Add `https://developers.google.com/oauthplayground` as an authorized redirect URI.
4. Open the [OAuth Playground](https://developers.google.com/oauthplayground):
   1. Under ⚙️ settings, enable *Use your own OAuth credentials* and enter your client ID and secret.
   2. Authorize the scope `https://www.googleapis.com/auth/calendar`, signed in as the calendar owner (e.g. a dedicated `consultations@auryx.net` or Knut's account).
   3. Exchange the code and copy the **refresh token**.
5. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` (`primary` or a specific calendar ID).
6. **Let authorized users modify events:** share the calendar with Knut and Mich with *Make changes to events*. Changes they make in Google Calendar (time moves, cancellations) sync back to Admin → Consultations when the page is opened.

How booking works:
- **Availability** comes from the Admin settings (days, hours, duration, buffer, minimum notice, booking horizon). The calendar's free/busy times and existing bookings are subtracted.
- Before creating a booking, the slot is **re-checked on the server under a database lock**, which prevents double-booking.
- The event is created with `sendUpdates=all`, so Google sends invitations to Knut, Mich and the visitor. The visitor can't modify the event (`guestsCanModify: false`).
- Visitors reschedule or cancel through their private link, up to the configured cut-off (12 hours by default). The link token is stored only as a SHA-256 hash.

## AI provider setup

The **provider is not locked in**. `src/lib/chatbot/providers.ts` defines a small `ChatProvider` interface.

| `AI_PROVIDER` | Notes |
|---|---|
| `anthropic` *(default when `AI_API_KEY` is set)* | Uses **Claude Haiku 4.5** (`claude-haiku-4-5`), which fits the BA's preference for a lightweight, low-cost, low-latency model. Override with `AI_MODEL`. |
| `openai-compatible` | Any `/chat/completions`-compatible API (set `AI_BASE_URL` and `AI_MODEL`) |
| `none` / no key | **FAQ-only mode.** Deterministic keyword matching that returns approved answers verbatim. It costs nothing and stays within approved knowledge, but it's less conversational. |

How the assistant stays within approved knowledge:
- The model only sees **enabled knowledge entries + published services + published case studies + About/contact/booking facts**.
- The **business and safety rules are fixed in code**: never invent services, pricing, timelines, results, guarantees, legal or security claims, never claim to be human, and don't guess. Admin knowledge goes into the prompt as *reference data*, so text in a knowledge entry can't override those rules.
- When it can't answer, it says so and shows **Send a Message / Book a Consultation** buttons.
- If the AI provider fails or times out, the assistant **falls back to FAQ mode**. The widget never breaks.
- Rate limits are 30 messages per 10 minutes per IP and 40 messages per conversation. Messages are capped at 1,000 characters.

Before production, **review the AI provider's data-handling terms**. Visitor messages are sent to that provider, and the Privacy Notice mentions this.

## Data retention

| Data | Default | Rule |
|---|---|---|
| Chat conversations | 6 months | since last activity |
| Contact inquiries | 12 months | since submission |
| Bookings | 12 months | since the consultation ended (upcoming bookings are never purged) |

- Change these in **Admin → Settings → Data retention**, and keep the Privacy Notice consistent with them.
- The purge runs daily through `GET /api/cron/retention` with header `Authorization: Bearer $CRON_SECRET`.
  - On **Vercel**, `vercel.json` schedules it at 02:00 PHT, and Vercel sends the secret automatically when `CRON_SECRET` is set.
  - On a **VPS**, add a system cron job: `0 2 * * * cd /srv/auryx && NEXT_PUBLIC_SITE_URL=https://auryx.net CRON_SECRET=… npm run retention:run`.
- It can also be run manually from Settings.
- Individual inquiries, bookings and conversations can be deleted in Admin, e.g. for data-subject erasure requests.

These periods are business targets from the BA. They are **not** a legal determination.

## Deployment

### Option A — Vercel + managed Postgres (lowest operations)
1. Create a Postgres database (e.g. **Neon** or **Supabase**) and copy its connection string.
2. Import the repository into Vercel (framework: Next.js).
3. Set all production environment variables, including `NEXT_PUBLIC_SITE_URL=https://auryx.net`.
4. Run migrations against the production database from a trusted machine:
   ```bash
   DATABASE_URL=postgres://... npm run db:migrate
   ```
5. Seed the initial content:
   ```bash
   DATABASE_URL=postgres://... npm run db:seed
   ```
6. Create the admin account:
   ```bash
   DATABASE_URL=postgres://... npm run admin:create
   ```
7. Deploy. Point `auryx.net` DNS at Vercel and confirm HTTPS works. The current auryx.net certificate shows a name-mismatch error, so this needs fixing.
8. Sign in to `/admin`, **enable MFA**, and review the items flagged "Needs Auryx review".

### Option B — VPS / any Node host
1. Run Node 22 behind a reverse proxy (Nginx/Caddy) with HTTPS. The proxy must set `X-Forwarded-For`.
2. Provide PostgreSQL (managed or local), set the env variables in the service environment, then run:
   ```bash
   npm ci
   ```
   ```bash
   npm run build
   ```
   ```bash
   npm run db:migrate
   ```
   ```bash
   npm run db:seed
   ```
   ```bash
   npm run admin:create
   ```
3. Run `npm start` (port 3000) under systemd or pm2, and add the retention cron entry shown above.

> Don't use PGlite in production. Use PostgreSQL.

## Testing

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run build
```

- `npm test` runs the unit tests (Vitest): booking slot rules and time zones, FAQ fallback, AI reply parsing, prompt rule order, and form validation.
- `npm run typecheck` runs TypeScript.
- `npm run build` does a production build.

See **Testing summary** in the delivery notes for the manual end-to-end checks that were run.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `AUTH_SECRET must be set` | Set a random ≥32-character `AUTH_SECRET` in production. |
| Emails not arriving | Check the dashboard's System status and the server logs (`email.*`, `inquiry.email_failed`). For Gmail, use an App Password and set up SPF/DKIM. |
| "We couldn't reach our calendar" | The refresh token may be revoked or expired, or the Calendar API isn't enabled. Regenerate the token (see setup). |
| No time slots shown | Check Settings → Consultation booking (enabled, days, hours, minimum notice), and whether the calendar is fully busy. |
| Assistant only gives FAQ answers | No `AI_API_KEY` is set, or the provider is failing. See the `chat.provider_failed` logs. |
| Locked out of Admin | Run `npm run admin:create` with the same email. This resets the password and MFA. |
| Local DB "locked" errors | Stop `npm run dev` before running scripts (PGlite is single-process). |
| Wrong links in emails or sitemap | Set `NEXT_PUBLIC_SITE_URL` **before** `npm run build`. |

## Decisions, assumptions & items for Auryx review

**Needs Auryx review before launch** (flagged in Admin with a badge):
1. **Privacy Notice** is a draft template aligned with the Data Privacy Act's transparency elements. It must be reviewed and approved by the responsible Auryx person. Acknowledging the checkbox does not by itself guarantee compliance.
2. **Maritime Attendance System case study** contains only the facts in the brief. There are no statistics, client names, outcomes or compliance claims. Confirm that publishing it and the EMSA-related wording are approved, and add verified details and images if available.
3. **Service descriptions and Home page copy** were rewritten from the existing site and the BA. Final copy approval is needed.
4. **Booking parameters** are PRD-level decisions that were set as editable defaults:
   - 30-minute consultations
   - 15-minute buffer
   - 24-hour minimum notice
   - 30-day booking horizon
   - 12-hour change cut-off
   - a Google Meet link added to each event

   Confirm whether consultations are online, in person, or both.
5. **Calendar account:** which Workspace account/calendar owns the bookings.
6. **AI provider:** Claude Haiku 4.5 is recommended for its cost, latency and quality. Review the provider's terms and data handling.

**Content that was deliberately not carried over** from the Lovable prototype, because it wasn't approved or couldn't be substantiated:
- the email `hello@auryx.com` (the approved address is `info@auryx.net`)
- "Bridging Norway & Philippines" (the approved location is Calatagan, Batangas)
- claims such as "tested rigorously" and "Security First"
- the hero background photo, since usage rights weren't confirmed

**Brand:** the bulb mark (the Lucide *lightbulb* icon in Auryx gold, as used on the current site), navy `#1B5998`, gold `#EEAD2B`, and the Inter font are kept. Maritime character comes from subtle SVG chart-grid and contour lines, not stock imagery.

## Known limitations

- **Visitor links:** after rescheduling, visitors keep using their original manage link. Emails for later changes don't repeat it because only the token's hash is stored.
- **Calendar sync:** changes made directly in Google Calendar sync into Admin when the Consultations page is opened. There are no real-time webhooks.
- **FAQ-only mode** matches keywords. It's reliable, but it can't handle paraphrases as well as the AI mode.
- **Rich text:** the CMS uses Markdown fields and "one item per line" lists instead of a WYSIWYG editor, which keeps it lightweight and XSS-safe.
- **Single admin:** there is one admin level, as specified. Adding more admin users needs `admin:create`, and there are no per-user permissions.
- **Visitor-facing text is English only.**
- **CSP:** the Content-Security-Policy allows inline scripts, because Next.js hydration needs them. Nonce-based CSP is a possible hardening step.
