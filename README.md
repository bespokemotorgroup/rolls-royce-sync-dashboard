# RR Content Sync — Admin Dashboard

A Next.js admin UI over the `rolls-royce-content-scraper` sync service's Postgres database:
reviewing pending field mappings, watching sync runs, inspecting detected changes, and browsing
saved page templates.

This app talks **directly to the sync service's Postgres database** (via `pg`) from server-side
code only. It does not call the sync service's API, Railway, or Payload — it only reads (and, for
mapping approve/reject, writes a single `status` column) against the shared database.

## Setup

1. Copy the env file and fill in real values:

   ```bash
   cp .env.example .env.local
   ```

   - `SYNC_DATABASE_URL` — the same Neon Postgres connection string the sync service uses
     (`sslmode=require`). Get this from the sync service's own `.env` / Railway variables.
   - `DASHBOARD_PASSWORD` — the shared password for the login gate.
   - `AUTH_SECRET` — random secret used to sign the session cookie. Generate with
     `openssl rand -hex 32`.

2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Visit `http://localhost:3000`, sign in with `DASHBOARD_PASSWORD`.

## Deploying to Vercel

Set `SYNC_DATABASE_URL`, `DASHBOARD_PASSWORD`, and `AUTH_SECRET` as environment variables in the
Vercel project settings, then deploy as a normal Next.js app. No other services or credentials are
required — this dashboard does not need `STAGING_PAYLOAD_URL`, Payload credentials, or
`SYNC_ADMIN_TOKEN`.

## Screens

- **Overview** — latest sync run, pending mapping counts, recent failures.
- **Runs** — full sync run history; click a run to see its recorded errors.
- **Pending Mappings** — the main review queue (`field_mappings WHERE status = 'pending'`),
  grouped by source page, with per-row and bulk approve/reject actions.
- **Recent Changes** — detected diffs (`change_events`) with previous/current field values and
  whether Payload blocked the change.
- **Templates** — saved block-structure stencils (`page_templates`).

## Safety notes

- Single shared password gate via a signed HttpOnly cookie (`src/middleware.ts`,
  `src/lib/auth.ts`) — every route except `/login` and `/api/login` requires a valid session.
- `SYNC_DATABASE_URL` is only ever read in server-side code (`src/lib/db.ts`) — never sent to the
  client.
- The only write path is `UPDATE field_mappings SET status = ...` (see
  `src/app/(dashboard)/mappings/actions.ts`). There is no delete UI and no raw SQL console.
- Triggering a sync run on demand is intentionally out of scope for v1 (the sync service runs as
  a Railway Cron Job with no always-on API to call).
