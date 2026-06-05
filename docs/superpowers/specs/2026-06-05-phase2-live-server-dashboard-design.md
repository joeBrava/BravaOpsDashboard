# Phase 2 — Live Server Dashboard (design spec)

**Date:** 2026-06-05
**Status:** Approved (design). Supersedes the static-export build for the live-data direction.
**Author:** Joe + Claude

## Goal

Turn the existing static `phase2-dashboard` prototype into a real, authenticated, **server-rendered** web app that the Brava sales team uses to check **project status** (Teamwork production stage) and **invoice status** (HubSpot) for any deal. Read-only against external systems. Reps may see each other's pipelines (privacy waived).

## Decisions locked (this session, 2026-06-05)

1. **Server-rendered, not static export.** Drop `output: "export"` + GitHub Pages. Run as a Node Next.js server (`next dev`/`next start` locally; deploy target Vercel). Required because live secret-backed reads and domain-locked Google SSO cannot work in a static export. The "Cockpit on cream" UI is unchanged.
2. **Live read-only data via an adapter**, fixtures-first. Build + test on fixtures; flip to live with one env change. Claude does **not** handle secrets — the user wires tokens later.
3. **Auth: Auth.js (NextAuth v5) Google SSO**, domain-locked to `buildbrava.com`.
4. **`/settings`: full persisted preferences** behind a `PreferencesStore` interface.
5. **No external writes, ever.** Teamwork/HubSpot/QuickBooks are read-only. (QBO has no connector; invoice status comes from HubSpot.)
6. **Phase 1 (n8n payments + Slack) is out of scope.** Notification toggles may appear in `/settings` but are inert until Phase 1 exists.

## Hard technical constraints — modified Next.js 16.2.7

This is **Next.js 16.2.7 + React 19.2.4 + Tailwind v4** and **diverges from training-data Next.js**. All build work MUST consult `phase2-dashboard/node_modules/next/dist/docs/` and `phase2-dashboard/AGENTS.md` before writing code. Known divergences:

- Server Components by default; `'use client'` opt-in.
- Dynamic route params are **async**: `params: Promise<{ id: string }>` — must `await params`.
- Tailwind **v4**: no `tailwind.config.js`; theme tokens live in `app/globals.css` `@theme {}`. PostCSS via `@tailwindcss/postcss`. No shadcn.
- Fonts via `next/font/google` (Plus Jakarta Sans + Inter, CSS variables).
- Metadata via `export const metadata`, not `next/head`.
- `fetch` in Server Components is not build-cached by default; use `"use cache"` or `<Suspense>` deliberately.
- Tests: Vitest, currently `environment: "node"`, `include: ["lib/**/*.test.ts"]`.

## Architecture (layered for isolation)

```
HubSpot (deals, invoice status) ─┐
                                 ├─→ lib/clients/* ─→ lib/data/LiveSource ─┐
Teamwork (projects, stages) ─────┘                                         ├─→ DashboardSource ─→ Server Components / route handlers ─→ existing UI
                                   lib/data/FixtureSource ─────────────────┘        ↑ Auth.js middleware gates every route
```

1. **API clients** — `lib/clients/hubspot.ts`, `lib/clients/teamwork.ts`. **Ported from `~/BBProjects/bb-bridge/src/clients/{hubspot,teamwork}.ts`** (clean read interfaces already exist). Read-only methods only. Token from env. HubSpot v3 Bearer (`api.hubapi.com`), 100 req/10s, honor `Retry-After`. Teamwork v1+v3 Basic/Bearer (`bravabrands.teamwork.com`), ~0.55s spacing, `include=customfieldProjects`.
2. **Data-source adapter** — `lib/data/source.ts`:
   ```ts
   interface DashboardSource {
     getProjects(): Promise<Project[]>;
     getProject(id: string): Promise<ProjectDetail | null>;
     getInvoices(): Promise<Invoice[]>;
   }
   ```
   Implementations: `FixtureSource` (today's mock data) and `LiveSource` (clients + mappers). Selected by `DATA_SOURCE` env; **auto-fixture when tokens absent.** This is the only switch to go live.
3. **Mapping layer** — `lib/data/mappers.ts`: HubSpot deal + Teamwork project → `Project`/`Invoice`. Isolates the two unknowns (below). Pure functions, fully unit-tested against captured fixtures.
4. **Server Components / route handlers** consume `DashboardSource`. A few route handlers (`app/api/*`) back client-side filtering where needed.
5. **UI layer** — existing components reused unchanged: `project-card`, `invoice-card`, `stage-chips`, `status-pill`, `sidebar`, `topbar`, `stat-card`, `filter-chips`, `update-toast`, `brand-mark`. Domain logic `lib/project-status.ts` + `lib/invoices.ts` reused with their tests.

## Domain model (reuse existing types verbatim)

- `Project { id, name, owner, ownerInitials, stages: ProductionStage[], status, note?, nextStep?, blocker? }`
- `ProductionStageKey = "brick"|"form"|"build"|"qa"|"ship"`, `StageState = "done"|"current"|"upcoming"`
- `ProjectStatusKey = "on_track"|"at_risk"|"blocked"|"shipping"`
- `Invoice { id, dealName, lineItem, amount, status, dueNote, overdue? }`, `InvoiceStatus = "unpaid"|"pending"|"paid"`
- New: `ProjectDetail` (extends `Project` with associated invoices, HubSpot/Teamwork metadata, notes, external links) for `/deals/[id]`.

## Known unknowns (isolated in mappers, refined against live data later)

1. **Teamwork → 5 production stages + state.** No clean existing definition (automations only flip category Active→In Production). Build a **configurable map** (`lib/data/stage-map.ts`) keyed by tasklist/milestone name → stage key, with best-effort matching and a documented default. Wrong guesses are a one-file change.
2. **Invoice paid status.** Phase-1 `qbo_*_invoice_paid_at` fields don't exist. Derive from `dealstage` + `qbo_invoice_id` + `amount`; document assumptions; revisit when verified live.

## Auth

Auth.js (NextAuth v5), Google provider, restricted to `buildbrava.com` (`hd` param + email-domain allowlist in the `signIn` callback). `middleware.ts` gates all routes. Env: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. `AUTH_DISABLED=true` dev-bypass so the app runs locally before OAuth is set up. The signed-in user's email drives the default "my pipeline" owner filter (but all reps can view all).

## Pages

- `/` **Pipeline** (live via adapter) — existing layout; add owner filter.
- `/invoices` (live via adapter) — existing layout.
- `/deals/[id]` **Deal detail** (new) — header, 5-stage timeline, associated invoices, HubSpot/Teamwork metadata, notes, deep-links to HubSpot deal + Teamwork project.
- `/settings` (new) — **full persisted preferences** via `PreferencesStore` interface. Local impl: SQLite (`better-sqlite3`) or JSON file. Production note: Vercel's filesystem is ephemeral → document a swap to Postgres/Vercel KV behind the same interface. Notification toggles present but labeled "arrives with Phase 1."
- Responsive for phones.

## Testing & verification

- Vitest extended: add `jsdom` env for component tests; keep `lib/**` node tests. Add `lib/data/*.test.ts` (mappers, source selection, stage-map), auth-guard tests, and `components/*.test.tsx` smoke tests.
- Gate per phase: `npm run test`, `npm run lint`, `tsc --noEmit`, `next build`, and a `next start` smoke check.

## Environment (user-provided later; not blocking)

`.env.local`: `HUBSPOT_API_TOKEN`, `TEAMWORK_API_TOKEN`, `TEAMWORK_DOMAIN=bravabrands.teamwork.com`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATA_SOURCE=fixture|live`, `AUTH_DISABLED`. 1Password refs (for the user): `op://APIs/HubSpot Service Key/credential`, `op://APIs/TeamWork API/credential`. Until set, app runs on fixtures with auth bypass.

## Build sequence (staged workflows, verify between)

- **A. Server conversion + scaffold** — next.config (drop export/basePath), deps, env scaffolding, client ports, `DashboardSource` + `FixtureSource`, pages read via adapter. App runs identically on fixtures.
- **B. Live data** — mappers + stage-map + `LiveSource` + tests.
- **C. Auth** — Auth.js Google SSO + domain lock + middleware + dev bypass.
- **D. Pages** — `/deals/[id]` + `/settings` (persisted prefs store).
- **E. Polish + verify** — responsive, component tests, full verification gate.

## Out of scope

Phase 1 (n8n QBO→HubSpot→Slack), real Vercel/Supabase provisioning, live token wiring (user does this), HubSpot-embedded cards.
