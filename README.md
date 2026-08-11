# RR Content Sync — Admin Dashboard

A Next.js admin UI over the `rolls-royce-content-scraper` sync service's Postgres database:
reviewing pending field mappings, watching sync runs, inspecting detected changes, and browsing
saved page templates.

This app reads review data directly from the sync database. When the final field in a change is
approved, it calls the authenticated sync-service API, which freshness-checks the official page,
updates Payload, and publishes the staging document immediately.

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
   - `SYNC_SERVICE_URL` — public URL of the always-on Railway sync service.
   - `SYNC_ADMIN_TOKEN` — the same private admin token configured on that sync service.

2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Visit `http://localhost:3000`, sign in with `DASHBOARD_PASSWORD`.

## Deploying to Vercel

Set `SYNC_DATABASE_URL`, `DASHBOARD_PASSWORD`, `AUTH_SECRET`, `SYNC_SERVICE_URL`, and
`SYNC_ADMIN_TOKEN` in the Vercel project settings, then deploy as a normal Next.js app. Payload
credentials remain only in the sync service and are never exposed to the dashboard client.

## Screens

- **Overview** — latest sync run, pending mapping counts, recent failures.
- **Runs** — full sync run history; click a run to see its recorded errors.
- **Pending Mappings** — the main review queue (`field_mappings WHERE status = 'pending'`),
  grouped by source page, with per-row and bulk approve/reject actions.
- **Recent Changes** — detected diffs (`change_events`) with previous/current field values and
  whether Payload blocked the change.
- **Review Queue** — approve or reject each individual field/image. When every row has a decision,
  approved rows publish immediately through the sync service and Payload.
- **Templates** — saved block-structure stencils (`page_templates`).

## Safety notes

- Single shared password gate via a signed HttpOnly cookie (`src/middleware.ts`,
  `src/lib/auth.ts`) — every route except `/login` and `/api/login` requires a valid session.
- `SYNC_DATABASE_URL` is only ever read in server-side code (`src/lib/db.ts`) — never sent to the
  client.
- Publishing uses a server-only authenticated request to the sync service; `SYNC_ADMIN_TOKEN` is
  never sent to the browser.
