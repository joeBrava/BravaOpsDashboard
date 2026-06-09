# Status

**Updated:** 2026-06-09

## Current state

**Phase 2 — Web dashboard: BUILT** (server-rendered). Implemented on branch
`feat/phase2-live-server-dashboard` and merged to `main`. Runs locally on fixtures
with auth bypassed; live data + real auth are config + credentials away.

**Phase 1 — Payment tracking + Slack DMs:** still out of scope here (separate n8n
effort). Notification toggles appear in `/settings` but are inert ("Arrives with Phase 1").

## What's done (Phase 2)

- **Server conversion** — dropped static export / GitHub Pages; now a Node Next.js
  server (Vercel/local). Next.js 16.2.7 + React 19 + Tailwind v4.
- **Read-only data adapter** — `DashboardSource` with `FixtureSource` (default) and
  `LiveSource` (HubSpot + Teamwork read clients ported from `bb-bridge`), selected by
  `DATA_SOURCE`; auto-falls back to fixtures when tokens are absent.
- **Mappers + stage-map** — HubSpot deal / Teamwork project → dashboard types, fully unit-tested.
- **Auth** — Auth.js v5 Google SSO, domain-locked to `buildbrava.com`; `proxy.ts` route gate; `AUTH_DISABLED` dev bypass.
- **Pages** — Pipeline (owner filter), Invoices, Deal detail (`/deals/[id]`), Settings (persisted prefs), Sign-in.
- **Polish** — responsive layout, loading/error/empty states, jsdom component tests.
- **Verification** — 170 tests passing, tsc clean, lint clean, `next build` green (all routes).

## Needs YOU (to go from fixtures → production)

1. Add read-only API tokens to `phase2-dashboard/.env.local` and set `DATA_SOURCE=live`
   (`HUBSPOT_API_TOKEN`, `TEAMWORK_API_TOKEN`; 1Password refs in `.env.example`).
2. Create a Google OAuth client; set `AUTH_SECRET` + `GOOGLE_CLIENT_ID/SECRET`, unset `AUTH_DISABLED`.
3. Deploy to Vercel and **swap the JSON prefs store** for Postgres / Vercel KV behind
   the `PreferencesStore` interface (serverless FS is ephemeral).

## Refine against live data (best-effort assumptions, isolated in the mapper)

- Teamwork tasklist/milestone → the 5 production stages (`lib/data/stage-map.ts`).
- Invoice paid status (`lib/data/mappers.ts`) — derived from `dealstage`/`qbo_invoice_id`/`amount`
  until Phase 1 creates real `qbo_*_invoice_paid_at` properties.

## Docs

- Spec: `docs/superpowers/specs/2026-06-05-phase2-live-server-dashboard-design.md`
- Plan: `docs/superpowers/plans/2026-06-05-phase2-live-server-dashboard.md`
- Run/deploy: `phase2-dashboard/README.md`
- Permissions setup (optional bypass + deny-rules): `docs/SECURITY-permissions-setup.md`

## Related projects in BBProjects/

- `bb-bridge/` — source of the reusable read-only HubSpot/Teamwork clients.
- `n8nAutomations/`, `Hubspot2Teamwork/` — Phase 1 / sync infrastructure (separate).
