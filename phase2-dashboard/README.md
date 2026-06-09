# Brava Ops Dashboard — Phase 2 (web app)

Server-rendered Next.js app for the Brava sales team to check **project status**
(Teamwork production stage) and **invoice status** (HubSpot) for any deal.
Read-only against external systems. Runs on built-in **fixtures** out of the box;
flip to **live** data with one env var.

> Stack: Next.js 16.2.7 (App Router, **server mode**) · React 19 · Tailwind v4 ·
> Auth.js v5 (Google SSO) · Vitest. See `AGENTS.md` — this Next.js diverges from
> older versions; read `node_modules/next/dist/docs/` before changing framework code.

## Quick start

```bash
cp .env.example .env.local      # local dev runs on fixtures with auth bypassed
npm install
npm run dev                     # http://localhost:3000
```

`.env.local` ships with `AUTH_DISABLED=true` and `DATA_SOURCE=fixture`, so it boots
with **no secrets** and seeded sample data.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (server output) |
| `npm run start` | Run the built server |
| `npm run test` | Vitest (node unit tests + jsdom component tests) |
| `npm run lint` | ESLint |

## Data source (fixtures ↔ live)

Pages read through `lib/data/source.ts → getSource()`, which returns:

- **`FixtureSource`** — seeded sample data (default).
- **`LiveSource`** — read-only HubSpot + Teamwork via `lib/clients/*` + `lib/data/mappers.ts`.

`getSource()` returns live **only** when `DATA_SOURCE=live` **and** both tokens are
present; otherwise it falls back to fixtures (and warns once). To go live, set in `.env.local`:

```
DATA_SOURCE=live
HUBSPOT_API_TOKEN=...        # 1Password: op://APIs/HubSpot Service Key/credential
TEAMWORK_API_TOKEN=...       # 1Password: op://APIs/TeamWork API/credential
TEAMWORK_DOMAIN=bravabrands.teamwork.com
```

Two mappings are best-effort until verified against live data (isolated in the mapper layer):
- **Teamwork → production stages** (`lib/data/stage-map.ts`) — name-keyed tasklist/milestone map.
- **Invoice paid status** (`lib/data/mappers.ts`) — derived from `dealstage`/`qbo_invoice_id`/`amount`
  because the Phase-1 `qbo_*_invoice_paid_at` properties don't exist yet.

## Auth

Auth.js (NextAuth v5) Google SSO, **domain-locked to `buildbrava.com`** (`auth.ts`
`signIn` callback). `proxy.ts` (Next 16's renamed middleware) gates every route except
`/signin` and `/api/auth/*`. For local dev, `AUTH_DISABLED=true` bypasses sign-in.
To enable real auth, unset `AUTH_DISABLED` and set:

```
AUTH_SECRET=...              # openssl rand -base64 32
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Settings storage

`/settings` persists preferences via `lib/prefs/store.ts (PreferencesStore)`. The local
implementation is a dependency-free JSON file under `data/` (gitignored).
**Production note:** serverless filesystems (Vercel) are ephemeral — swap the impl in
`getPreferencesStore()` for Postgres / Vercel KV behind the same interface.

## Deploy

Server mode → deploy to **Vercel** (or any Node host). Set the env vars above in the
platform, switch the prefs store to a durable DB, and configure the Google OAuth client's
redirect URI to `https://<host>/api/auth/callback/google`.

## Architecture

```
HubSpot, Teamwork ─→ lib/clients/* ─→ lib/data/LiveSource ─┐
                                lib/data/FixtureSource ─────┼─→ getSource() ─→ server components / route handlers ─→ UI
                                                            │   proxy.ts gates routes (Auth.js session)
```

Routes: `/` (Pipeline), `/invoices`, `/deals/[id]`, `/settings`, `/signin`,
`/api/auth/[...nextauth]`, `/api/preferences`.
