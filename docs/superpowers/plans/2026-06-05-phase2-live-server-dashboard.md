# Phase 2 Live Server Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **MODIFIED NEXT.JS — READ FIRST:** This is Next.js **16.2.7** + React 19.2.4 + Tailwind v4. It diverges from training data. Before writing any framework code (config, routing, server/client components, fonts, metadata, middleware), READ the relevant guide under `phase2-dashboard/node_modules/next/dist/docs/` and `phase2-dashboard/AGENTS.md`. Do NOT rely on remembered Next.js APIs. Framework-agnostic code (types, mappers, pure logic, tests) is given in full below.

**Goal:** Convert the static `phase2-dashboard` prototype into a server-rendered, authenticated Next.js app that reads live (read-only) project status from Teamwork and invoice status from HubSpot through a fixtures-first adapter.

**Architecture:** Layered — `lib/clients/*` (read-only HubSpot/Teamwork, ported from bb-bridge) → `lib/data/*` (DashboardSource adapter with FixtureSource + LiveSource, plus mappers) → Server Components/route handlers → existing UI. Auth.js (NextAuth v5) Google SSO domain-locked to buildbrava.com gates every route. `/settings` persists via a PreferencesStore interface.

**Tech Stack:** Next.js 16.2.7 (App Router, server mode), React 19.2.4, Tailwind v4, TypeScript (strict), Vitest (+ jsdom for components), Auth.js v5, better-sqlite3 (local prefs store).

**Working dir:** all commands run from `phase2-dashboard/`. All work on branch `feat/phase2-live-server-dashboard`. Commit after each task.

---

## File structure (created/modified)

| Path | Responsibility |
|---|---|
| `next.config.ts` | MODIFY — drop `output:"export"`, `basePath`, `trailingSlash`; server mode |
| `package.json` | MODIFY — add `next-auth@beta`, `better-sqlite3`, `jsdom`, `@testing-library/*` |
| `vitest.config.ts` | MODIFY — projects: node (`lib/**`) + jsdom (`components/**`, `app/**`) |
| `lib/env.ts` | CREATE — typed env access + `DATA_SOURCE`/`AUTH_DISABLED` resolution |
| `lib/clients/hubspot.ts` | CREATE — read-only HubSpot v3 client (port from bb-bridge) |
| `lib/clients/teamwork.ts` | CREATE — read-only Teamwork v1+v3 client (port from bb-bridge) |
| `lib/data/source.ts` | CREATE — `DashboardSource` interface + `getSource()` selector |
| `lib/data/fixture-source.ts` | CREATE — `FixtureSource` over existing mock data |
| `lib/data/live-source.ts` | CREATE — `LiveSource` (clients + mappers) |
| `lib/data/mappers.ts` | CREATE — HubSpot/Teamwork → `Project`/`Invoice`/`ProjectDetail` |
| `lib/data/stage-map.ts` | CREATE — configurable Teamwork→production-stage mapping |
| `lib/data/*.test.ts` | CREATE — mapper/source/stage-map unit tests |
| `lib/types.ts` | MODIFY — add `ProjectDetail`, external-link fields |
| `lib/mock-data.ts` | MODIFY — add a `projectDetails` fixture + invoice↔project links |
| `auth.ts` | CREATE — Auth.js config (Google, domain lock, callbacks) |
| `middleware.ts` | CREATE — route gate (respects `AUTH_DISABLED`) |
| `app/api/auth/[...nextauth]/route.ts` | CREATE — Auth.js handler |
| `app/(auth)/signin/page.tsx` | CREATE — sign-in page |
| `app/page.tsx`, `app/invoices/page.tsx` | MODIFY — read via `getSource()`, add owner filter |
| `app/deals/[id]/page.tsx` | CREATE — deal detail (async params) |
| `app/settings/page.tsx` | CREATE — settings UI |
| `app/api/preferences/route.ts` | CREATE — GET/PUT prefs |
| `lib/prefs/store.ts` | CREATE — `PreferencesStore` interface + selector |
| `lib/prefs/sqlite-store.ts` | CREATE — local SQLite impl |
| `lib/prefs/*.test.ts` | CREATE — prefs store tests |
| `components/*` | REUSE unchanged; add `components/*.test.tsx` smoke tests in Phase E |
| `.env.example` | CREATE — documents all env vars |
| `README.md` | MODIFY — server-mode run/deploy + env instructions |

---

## Phase A — Server conversion + scaffold

Goal: app runs identically to today, but server-rendered and reading through the adapter (FixtureSource). No behavior change visible to a user.

### Task A1: Convert build to server mode
**Files:** Modify `next.config.ts`; Modify `package.json` (scripts if needed); Modify `README.md`.
- [ ] Read `node_modules/next/dist/docs/` config + deployment guides for v16 server mode.
- [ ] Remove `output:"export"`, `basePath:"/BravaOpsDashboard"`, `trailingSlash:true`, `images.unoptimized` (keep if still needed). Keep app on default server output.
- [ ] `npm run build` then start the server; confirm `/` and `/invoices` render (still on mock data).
- [ ] Commit: `feat: switch dashboard from static export to server mode`.

### Task A2: Typed env module
**Files:** Create `lib/env.ts`, `.env.example`; Test `lib/env.test.ts`.
- [ ] Test: with no env, `getDataSourceMode()` returns `"fixture"`; with `DATA_SOURCE=live` AND tokens present, returns `"live"`; with `DATA_SOURCE=live` but tokens missing, returns `"fixture"` and logs a warning.
- [ ] Implement `lib/env.ts`: read `HUBSPOT_API_TOKEN`, `TEAMWORK_API_TOKEN`, `TEAMWORK_DOMAIN`, `DATA_SOURCE`, `AUTH_DISABLED`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`; export typed getters; never throw on missing (degrade to fixture/bypass).
- [ ] `.env.example` documents every var + 1Password refs from the spec.
- [ ] Run test → pass. Commit: `feat: typed env access with fixture/live resolution`.

### Task A3: DashboardSource interface + selector
**Files:** Create `lib/data/source.ts`.
```ts
import type { Project, ProjectDetail, Invoice } from "@/lib/types";
export interface DashboardSource {
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<ProjectDetail | null>;
  getInvoices(): Promise<Invoice[]>;
}
// getSource() returns FixtureSource or LiveSource based on getDataSourceMode().
// LiveSource imported lazily so fixture mode never requires tokens/clients.
```
- [ ] Create the interface + `getSource()` (LiveSource wired in Phase B; until then `getSource` always returns FixtureSource).
- [ ] Commit: `feat: DashboardSource interface + source selector`.

### Task A4: FixtureSource
**Files:** Create `lib/data/fixture-source.ts`; Modify `lib/mock-data.ts` (add `projectDetails`); Test `lib/data/fixture-source.test.ts`.
- [ ] Test: `getProjects()` returns the 4 seed projects; `getInvoices()` returns 6; `getProject("salt-lake-temple")` returns a `ProjectDetail` with linked invoices; `getProject("nope")` returns null.
- [ ] Implement `FixtureSource` reading existing `mock-data.ts`. Add a minimal `projectDetails` map + invoice→project linkage in `mock-data.ts` (keep existing exports intact so current pages don't break mid-refactor).
- [ ] Run test → pass. Commit: `feat: FixtureSource over mock data`.

### Task A5: Pages read through the adapter
**Files:** Modify `app/page.tsx`, `app/invoices/page.tsx`.
- [ ] Read v16 server-component data-fetching docs. Convert pages to async server components that `await getSource().getProjects()/getInvoices()` instead of importing mock data directly.
- [ ] Visual parity check: `next build` + start; `/` and `/invoices` look identical to before.
- [ ] Commit: `refactor: pages read project/invoice data via DashboardSource`.

### Task A6: Phase A verification gate
- [ ] Run `npm run test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and a `next start` smoke load of `/` and `/invoices`. All green.
- [ ] Commit any fixups: `chore: phase A verification fixups`.

---

## Phase B — Live data (mappers, stage-map, LiveSource)

Goal: a real read-only live path, fully unit-tested against captured-shape fixtures. Not activated unless tokens present.

### Task B1: Port read-only API clients
**Files:** Create `lib/clients/hubspot.ts`, `lib/clients/teamwork.ts`; Tests for each.
- [ ] Port `~/BBProjects/bb-bridge/src/clients/{hubspot,teamwork}.ts`, keeping ONLY read methods (`getDeal`, list deals, associations, `getProject`, list projects w/ `include=customfieldProjects`). Delete/omit any patch/post/create methods.
- [ ] HubSpot: Bearer auth, `api.hubapi.com`, 429 `Retry-After` honored. Teamwork: Basic `base64(token:)`, `bravabrands.teamwork.com`, v3 list/get.
- [ ] Tests: mock `fetch`; assert correct URL/headers, pagination cursor handling, 429 retry. NO real network.
- [ ] Commit: `feat: read-only HubSpot + Teamwork API clients`.

### Task B2: Stage map (Teamwork → production stages)
**Files:** Create `lib/data/stage-map.ts`; Test `lib/data/stage-map.test.ts`.
- [ ] `mapTeamworkToStages(input): ProductionStage[]` — given Teamwork tasklist/milestone names + completion, produce the 5 ordered stages (brick/form/build/qa/ship) with `done/current/upcoming`. Name-keyed config map with documented defaults; unknown names default to upcoming.
- [ ] Tests: all-complete → all done; none → brick current rest upcoming; mid-progress → correct current boundary; canonical order preserved.
- [ ] Commit: `feat: configurable Teamwork-to-production-stage mapping`.

### Task B3: Mappers
**Files:** Create `lib/data/mappers.ts`; Test `lib/data/mappers.test.ts`.
- [ ] `dealToInvoices(deal)` → `Invoice[]` (design/P1/P2 milestones from `dealstage`/`qbo_invoice_id`/`amount`; status unpaid/pending/paid per documented assumption; `overdue` from due date).
- [ ] `projectFrom(deal, twProject)` → `Project` (name, owner from `hubspot_owner_id`→initials, stages via stage-map, status heuristic, note/nextStep/blocker).
- [ ] `projectDetailFrom(...)` → `ProjectDetail` (Project + invoices + HubSpot/Teamwork links + metadata).
- [ ] Tests: feed captured-shape HubSpot deal + Teamwork project fixtures; assert exact mapped output. Document every assumption inline.
- [ ] Commit: `feat: HubSpot/Teamwork to dashboard-type mappers`.

### Task B4: LiveSource + wire into selector
**Files:** Create `lib/data/live-source.ts`; Modify `lib/data/source.ts`; Test `lib/data/live-source.test.ts`.
- [ ] `LiveSource` implements `DashboardSource` using the clients + mappers. `getSource()` returns it only when `getDataSourceMode()==="live"`.
- [ ] Test with mocked clients: `getProjects()` maps correctly; errors degrade gracefully (log + empty/partial, never crash a page).
- [ ] Commit: `feat: LiveSource wired behind DATA_SOURCE=live`.

### Task B5: Phase B verification gate
- [ ] `npm run test` (all mapper/client/source tests), `lint`, `tsc`, `build`. Green. Commit fixups.

---

## Phase C — Auth (Google SSO, domain-locked)

### Task C1: Auth.js config
**Files:** Create `auth.ts`, `app/api/auth/[...nextauth]/route.ts`; Modify `package.json` (add `next-auth@beta`).
- [ ] Read v16 + Auth.js v5 App-Router docs. Configure Google provider; `signIn` callback rejects any email whose domain ≠ `buildbrava.com` (and check `hd`). Export `auth`, `handlers`, `signIn`, `signOut`.
- [ ] Commit: `feat: Auth.js Google SSO config, domain-locked to buildbrava.com`.

### Task C2: Route protection middleware
**Files:** Create `middleware.ts`; Test `lib/auth-guard.test.ts` (pure helper).
- [ ] A pure `isAllowedEmail(email)` helper + test (accepts `x@buildbrava.com`, rejects others/empty). `middleware.ts` redirects unauthenticated → `/signin`, EXCEPT when `AUTH_DISABLED==="true"` (dev bypass passes through with a stub user).
- [ ] Commit: `feat: middleware route gate with AUTH_DISABLED dev bypass`.

### Task C3: Sign-in page + session in layout
**Files:** Create `app/(auth)/signin/page.tsx`; Modify `app/layout.tsx`.
- [ ] Sign-in page (branded, "Cockpit on cream") with Google button. Layout reads session (or stub when bypassed) to show the current user in the sidebar profile slot.
- [ ] Commit: `feat: sign-in page + session-aware layout`.

### Task C4: Owner filter uses session
**Files:** Modify `app/page.tsx` (+ a client filter component if needed).
- [ ] Default Pipeline to the signed-in user's owned projects, with a visible toggle to "All team" (privacy waived). Bypass mode uses a stub owner.
- [ ] Commit: `feat: pipeline owner filter defaults to signed-in user`. Verification gate: test/lint/tsc/build green.

---

## Phase D — Deal detail + Settings (persisted)

### Task D1: ProjectDetail type + fixtures
**Files:** Modify `lib/types.ts`, `lib/mock-data.ts`.
- [ ] Add `ProjectDetail` (Project + `invoices: Invoice[]`, `hubspotUrl`, `teamworkUrl`, `companyName?`, `dueDate?`, `history?: {at,label}[]`). Extend fixtures. Update FixtureSource `getProject` to return it. Test updates pass.
- [ ] Commit: `feat: ProjectDetail type + detail fixtures`.

### Task D2: Deal detail page
**Files:** Create `app/deals/[id]/page.tsx`; maybe `components/stage-timeline.tsx`, `components/detail-meta.tsx`.
- [ ] Read v16 dynamic-route docs (params are async). Build the page: header + status, 5-stage timeline (reuse `stage-chips` or a vertical timeline), associated invoices (reuse `invoice-card`), metadata, deep-links. `notFound()` when `getProject` returns null.
- [ ] Make project/invoice cards link to `/deals/[id]`.
- [ ] Commit: `feat: deal detail page at /deals/[id]`.

### Task D3: PreferencesStore interface + SQLite impl
**Files:** Create `lib/prefs/store.ts`, `lib/prefs/sqlite-store.ts`; Modify `package.json` (`better-sqlite3`); Test `lib/prefs/sqlite-store.test.ts`.
```ts
export interface Preferences { defaultView: "mine"|"all"; theme: "system"|"light"|"dark";
  density: "comfortable"|"compact"; notifyDigest: boolean; notifyAlerts: boolean; }
export interface PreferencesStore {
  get(userEmail: string): Promise<Preferences>;        // returns defaults if unset
  set(userEmail: string, prefs: Preferences): Promise<void>;
}
```
- [ ] SQLite impl (file in a gitignored data dir). Tests: default on first read; set then get round-trips; per-user isolation.
- [ ] Document in README that production (ephemeral Vercel FS) must swap to Postgres/Vercel KV behind this same interface.
- [ ] Commit: `feat: PreferencesStore interface + SQLite impl`.

### Task D4: Preferences API
**Files:** Create `app/api/preferences/route.ts`.
- [ ] GET returns current user's prefs; PUT validates + saves. Uses session email (stub in bypass). Read v16 route-handler docs.
- [ ] Commit: `feat: preferences GET/PUT route handler`.

### Task D5: Settings page
**Files:** Create `app/settings/page.tsx` (+ a client form component).
- [ ] Form bound to the prefs API (load on mount, save on change w/ toast). Notification toggles present but disabled + labeled "Arrives with Phase 1." Wire sidebar "Settings" to navigate here.
- [ ] Commit: `feat: settings page with persisted preferences`.

### Task D6: Phase D verification gate
- [ ] test/lint/tsc/build + smoke `/deals/<id>` and `/settings`. Green. Commit fixups.

---

## Phase E — Responsive polish + component tests + full verify

### Task E1: jsdom test project + component smoke tests
**Files:** Modify `vitest.config.ts`, `package.json`; Create `components/*.test.tsx` (project-card, invoice-card, status-pill, stage-chips).
- [ ] Configure vitest projects (node for `lib/**`, jsdom for `components/**`+`app/**`). Add `@testing-library/react`, `jsdom`. Smoke tests render each component with sample props and assert key text/roles.
- [ ] Commit: `test: jsdom component smoke tests`.

### Task E2: Responsive pass
**Files:** Modify `components/sidebar.tsx`, page layouts, `globals.css` as needed.
- [ ] Collapsible sidebar / mobile nav; stat row + card lists reflow on small screens. Manual check at 375px/768px/1280px (use the run skill).
- [ ] Commit: `feat: responsive layout for phone/tablet`.

### Task E3: Empty/error/loading states
**Files:** page-level `loading.tsx`/`error.tsx` per v16 docs; empty states in lists.
- [ ] Add Suspense/loading + error boundaries for the live path; friendly empty states.
- [ ] Commit: `feat: loading, error, and empty states`.

### Task E4: Full verification + docs
- [ ] Full gate: `npm run test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `next start` smoke of all routes (fixture mode + a documented dry of live mode with fake tokens hitting the graceful-degrade path).
- [ ] Update `README.md` (run, env, deploy-to-Vercel, fixture↔live switch, prod prefs-store note) and `STATUS.md`.
- [ ] Commit: `docs: README + STATUS for live server dashboard`.

---

## Self-review

- **Spec coverage:** server conversion (A1) ✓; live adapter + fixtures-first (A3–A4, B) ✓; Google SSO domain-lock (C) ✓; persisted settings (D3–D5) ✓; deal detail (D2) ✓; known-unknowns isolated in stage-map (B2) + invoice mapper (B3) ✓; responsive (E2) ✓; verification gates per phase ✓; no external writes (clients are read-only by construction, B1) ✓; Phase 1 out of scope (settings toggles inert) ✓.
- **Placeholders:** framework code intentionally deferred to implementation-against-local-docs (justified by the modified Next.js); all interfaces/types/test expectations are concrete.
- **Type consistency:** `DashboardSource`, `Preferences(Store)`, `ProjectDetail` names used consistently across A/B/D.
