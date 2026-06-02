# Pipeline → Production View — Design

**Date:** 2026-06-02
**Status:** Approved
**Scope:** Reframe the existing Pipeline page from a sales/payment view into a tracker for projects **currently in production**. Static mock data, look-only, deploys as part of the existing static export. The Invoices page is untouched (separate data layer).

## Goal

The Pipeline tab should read as "projects currently in Production in Teamwork."
Change the wording and visuals so each card shows where a project sits in the build
flow and its health — not payment milestones. No real Teamwork integration yet.

## Production Stages (ordered, 5)

`Brick Selection → Production Form → Build → QA / Approval → Ship`

Each stage has a state:
- `done` — rendered with a ✓ and the active/lime treatment
- `current` — rendered with a ▷ and a highlighted treatment
- `upcoming` — rendered muted

These replace the Design / P1 / P2 payment milestone chips.

## Status (project health)

Authored explicitly per project (health is not purely a function of stage position,
so it is NOT derived):

| Key | Label | Color token |
|---|---|---|
| `on_track` | On track | lime |
| `at_risk` | At risk | gold |
| `blocked` | Blocked | danger |
| `shipping` | Shipping | teal |

Filters (passed to the existing parametrized `FilterChips`): `All / On track / At risk / Shipping`.

## Wording Changes (`app/page.tsx`)

- Title `Your Pipeline` → `Production Pipeline`
- Sub `Tuesday, June 2 · 3 active deals` → `Tuesday, June 2 · 4 in production`
- Section heading `Active deals` → `In production`
- Stat cards `Active / Ready to move / Blocked / Paid yesterday` →
  `In production` / `On track` / `Needs attention` / `Shipping`
  (Needs attention = count of `at_risk` + `blocked`)
- Card action button: `Send reminder` → `Follow up` for `at_risk`/`blocked`, else `View`
- "deals" → "projects" throughout

## Mock Projects (re-authored, 4 — one per status)

| id | name | current stage | status | context |
|---|---|---|---|---|
| `salt-lake-temple` | Salt Lake Temple | Build | on_track | "Build underway — next: QA review" |
| `acme-corp-q3` | Acme Corp Q3 | Production Form | at_risk | "Production Form awaiting approval · 3d" |
| `big-customer-logo` | Big Customer Logo | QA / Approval | blocked | blocker: "⚠️ QA flagged a color mismatch" |
| `riverside-plaza` | Riverside Plaza | Ship | shipping | "Out for delivery · ETA Fri" |

Stage states per project (brick / form / build / qa / ship):
- Salt Lake Temple: done / done / current / upcoming / upcoming
- Acme Corp Q3: done / current / upcoming / upcoming / upcoming
- Big Customer Logo: done / done / done / current / upcoming
- Riverside Plaza: done / done / done / done / current

Summary counts (derived from the projects):
- `inProduction` = 4 (total)
- `onTrack` = 1 (`on_track`)
- `needsAttention` = 2 (`at_risk` + `blocked`)
- `shipping` = 1 (`shipping`)

## Visual

- Card keeps its current shape; left-edge color follows status
  (`on_track` → lime, `at_risk` → gold, `blocked` → danger, `shipping` → teal).
- Stage chips render left-to-right with ✓ (done) / ▷ (current) / · (upcoming) treatment.

## Components & Files

All Pipeline-scoped. Rename via `git mv` to preserve history. The Invoices page,
`lib/invoices.ts`, `components/invoice-card.tsx`, and `components/stat-card.tsx`
(reused) are NOT changed beyond what is listed.

- `lib/types.ts` — replace `Deal` / `Milestone` / `MilestoneKey` / `PaymentState` /
  `DealStatusKey` with:
  - `ProductionStageKey = "brick" | "form" | "build" | "qa" | "ship"`
  - `StageState = "done" | "current" | "upcoming"`
  - `ProductionStage { key: ProductionStageKey; state: StageState }`
  - `ProjectStatusKey = "on_track" | "at_risk" | "blocked" | "shipping"`
  - `Project { id; name; owner; ownerInitials; stages: ProductionStage[]; status: ProjectStatusKey; note?: string; nextStep?: string; blocker?: string }`
- `lib/deal-status.ts` → `lib/project-status.ts`:
  - `STATUS_META: Record<ProjectStatusKey, StatusMeta>` (label / edgeClass / pillClass / dotClass)
  - `getProjectStatusMeta(key)`
  - `STAGE_LABELS: Record<ProductionStageKey, string>` (display labels)
  - `STAGE_ORDER: ProductionStageKey[]` (canonical order for rendering)
  - `stageStateClass(state: StageState): string` (chip styling helper)
  - `stageStateIcon(state: StageState): string` (✓ / ▷ / · )
  - No `deriveStatus` (status is explicit on each project).
- `lib/deal-status.test.ts` → `lib/project-status.test.ts` — updated tests.
- `lib/mock-data.ts` — re-authored `projects` array + derived `summary`.
- `components/deal-card.tsx` → `components/project-card.tsx` (`ProjectCard`).
- `components/milestone-chips.tsx` → `components/stage-chips.tsx` (`StageChips`).
- `app/page.tsx` — rewording, new imports, production filters.
- `components/filter-chips.tsx` — no change (already accepts `filters`); page passes the production list.
- `components/status-pill.tsx`, `components/stat-card.tsx` — reused unchanged.

## Testing

`lib/project-status.test.ts` (vitest):
- `getProjectStatusMeta` returns a non-empty label + non-empty edge/pill/dot classes for
  each of the four statuses.
- `getProjectStatusMeta("blocked").edgeClass` contains `border-l-danger`;
  `getProjectStatusMeta("shipping").edgeClass` contains `border-l-teal`.
- `STAGE_ORDER` has all 5 stage keys in order; `STAGE_LABELS` has a label for each.
- `stageStateIcon` maps `done`/`current`/`upcoming` to distinct non-empty strings.

## Verification

- `npm run test` passes (the renamed Pipeline test + the unchanged invoices test).
- `npm run build` succeeds; both `/` and `/invoices/` still export.
- The home page (`out/index.html`) shows "Production Pipeline", the production stage
  chips, and the four reworded stat cards.

## Out of Scope (YAGNI)

- Real Teamwork API integration / live data.
- Interactive filtering or stage editing.
- Any change to the Invoices page.
