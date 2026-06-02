# Pipeline Production-View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the static Pipeline page from a sales/payment view into a tracker for projects currently in production, with production stages and health statuses.

**Architecture:** Rename the Pipeline-specific data/types/components from "deal/milestone" to "project/stage" (via `git mv` to preserve history), give each project an ordered 5-stage build flow and an explicit health status, and rework the page wording. All changes are Pipeline-scoped; the Invoices page and its data layer are untouched.

**Tech Stack:** Next.js 16 (App Router, `output: "export"`, `trailingSlash: true`, `basePath: "/BravaOpsDashboard"`), React 19, Tailwind CSS v4, TypeScript, Vitest.

---

## File Structure

- **`lib/types.ts`** (rewrite) — `Project`, `ProductionStage`, `ProductionStageKey`, `StageState`, `ProjectStatusKey`. Replaces the deal/milestone/payment types.
- **`lib/project-status.ts`** (rename from `lib/deal-status.ts`, rewrite) — status metadata map + stage ordering/labels/icon helpers. No `deriveStatus` (status is explicit on each project).
- **`lib/project-status.test.ts`** (rename from `lib/deal-status.test.ts`, rewrite) — unit tests for the status map and stage helpers.
- **`lib/mock-data.ts`** (rewrite) — the re-authored `projects` array, derived `summary`, and `recentUpdate` toast message.
- **`components/stage-chips.tsx`** (rename from `components/milestone-chips.tsx`, rewrite) — renders the 5 ordered stage chips.
- **`components/project-card.tsx`** (rename from `components/deal-card.tsx`, rewrite) — one project row.
- **`components/update-toast.tsx`** (rename from `components/payment-toast.tsx`) — generic toast; component body unchanged, just renamed.
- **`app/page.tsx`** (rewrite) — production wording, new imports, production filters.
- **`components/status-pill.tsx`, `components/stat-card.tsx`, `components/filter-chips.tsx`** — reused unchanged (FilterChips already accepts a `filters` prop).

**Important — interdependent rename:** these files import each other, so intermediate commits will NOT fully type-check. Do NOT run `npx tsc --noEmit` or `npm run build` between tasks — only the targeted Vitest run in Task 1, then the full type-check + build once in Task 8. This is expected for a coordinated rename.

**Execution environment:** Run `npm`/`npx` from inside `phase2-dashboard/`. Run `git` from the repo root `/Users/kinkyzinky/BBProjects/BravaOpsDashboard` (the `git mv` / `git add` paths below are repo-root-relative).

---

## Task 1: Types + project-status lib + tests

**Files:**
- Rewrite: `phase2-dashboard/lib/types.ts`
- Rename + rewrite: `phase2-dashboard/lib/deal-status.ts` → `phase2-dashboard/lib/project-status.ts`
- Rename + rewrite: `phase2-dashboard/lib/deal-status.test.ts` → `phase2-dashboard/lib/project-status.test.ts`

- [ ] **Step 1: Rename the lib files with git (preserves history)**

```bash
git mv phase2-dashboard/lib/deal-status.ts phase2-dashboard/lib/project-status.ts
git mv phase2-dashboard/lib/deal-status.test.ts phase2-dashboard/lib/project-status.test.ts
```

- [ ] **Step 2: Rewrite `phase2-dashboard/lib/types.ts`**

Replace the ENTIRE file contents with:

```ts
export type ProductionStageKey = "brick" | "form" | "build" | "qa" | "ship";

export type StageState = "done" | "current" | "upcoming";

export interface ProductionStage {
  key: ProductionStageKey;
  state: StageState;
}

export type ProjectStatusKey = "on_track" | "at_risk" | "blocked" | "shipping";

export interface Project {
  id: string;
  name: string;
  owner: string;
  ownerInitials: string;
  stages: ProductionStage[];
  /** explicit project health (not derived from stages) */
  status: ProjectStatusKey;
  /** short context line */
  note?: string;
  /** "next: …" line */
  nextStep?: string;
  /** "⚠️ …" blocker line (present when blocked) */
  blocker?: string;
}
```

- [ ] **Step 3: Write the failing test — rewrite `phase2-dashboard/lib/project-status.test.ts`**

Replace the ENTIRE file contents with:

```ts
import { describe, it, expect } from "vitest";
import {
  getProjectStatusMeta,
  STAGE_ORDER,
  STAGE_LABELS,
  stageStateIcon,
} from "./project-status";
import type { ProjectStatusKey } from "./types";

describe("getProjectStatusMeta", () => {
  it("maps each status to a label and non-empty classes", () => {
    for (const key of [
      "on_track",
      "at_risk",
      "blocked",
      "shipping",
    ] as ProjectStatusKey[]) {
      const meta = getProjectStatusMeta(key);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.edgeClass.length).toBeGreaterThan(0);
      expect(meta.pillClass.length).toBeGreaterThan(0);
      expect(meta.dotClass.length).toBeGreaterThan(0);
    }
  });

  it("uses the danger edge for blocked and teal edge for shipping", () => {
    expect(getProjectStatusMeta("blocked").edgeClass).toContain("border-l-danger");
    expect(getProjectStatusMeta("shipping").edgeClass).toContain("border-l-teal");
  });
});

describe("stages", () => {
  it("STAGE_ORDER lists all five stages in build order", () => {
    expect(STAGE_ORDER).toEqual(["brick", "form", "build", "qa", "ship"]);
  });

  it("STAGE_LABELS has a non-empty label for every ordered stage", () => {
    for (const key of STAGE_ORDER) {
      expect(STAGE_LABELS[key].length).toBeGreaterThan(0);
    }
  });

  it("stageStateIcon maps each state to a distinct non-empty glyph", () => {
    const done = stageStateIcon("done");
    const current = stageStateIcon("current");
    const upcoming = stageStateIcon("upcoming");
    expect(done.length).toBeGreaterThan(0);
    expect(current.length).toBeGreaterThan(0);
    expect(upcoming.length).toBeGreaterThan(0);
    expect(new Set([done, current, upcoming]).size).toBe(3);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run (from `phase2-dashboard/`): `npm run test -- lib/project-status.test.ts`
Expected: FAIL — `project-status` still has the old deal exports (`deriveStatus`, `getStatusMeta`, `milestoneDotClass`), so the new imports (`getProjectStatusMeta`, `STAGE_ORDER`, `STAGE_LABELS`, `stageStateIcon`) are undefined.

- [ ] **Step 5: Rewrite `phase2-dashboard/lib/project-status.ts`**

Replace the ENTIRE file contents with:

```ts
import type {
  ProductionStageKey,
  ProjectStatusKey,
  StageState,
} from "./types";

export interface StatusMeta {
  label: string;
  /** Tailwind class for the card's left edge color */
  edgeClass: string;
  /** Tailwind classes for the status pill (bg + text) */
  pillClass: string;
  /** Tailwind class for the pill's leading dot */
  dotClass: string;
}

const META: Record<ProjectStatusKey, StatusMeta> = {
  on_track: {
    label: "On track",
    edgeClass: "border-l-lime",
    pillClass: "bg-[#f1f5ce] text-[#5c6a00]",
    dotClass: "bg-lime",
  },
  at_risk: {
    label: "At risk",
    edgeClass: "border-l-gold",
    pillClass: "bg-[#fff1c9] text-[#876a00]",
    dotClass: "bg-gold",
  },
  blocked: {
    label: "Blocked",
    edgeClass: "border-l-danger",
    pillClass: "bg-[#ffe1e5] text-[#c20f2b]",
    dotClass: "bg-danger",
  },
  shipping: {
    label: "Shipping",
    edgeClass: "border-l-teal",
    pillClass: "bg-[#d7f4f2] text-[#00726e]",
    dotClass: "bg-teal",
  },
};

export function getProjectStatusMeta(key: ProjectStatusKey): StatusMeta {
  return META[key];
}

/** Canonical left-to-right render order of production stages. */
export const STAGE_ORDER: ProductionStageKey[] = [
  "brick",
  "form",
  "build",
  "qa",
  "ship",
];

export const STAGE_LABELS: Record<ProductionStageKey, string> = {
  brick: "Brick Selection",
  form: "Production Form",
  build: "Build",
  qa: "QA / Approval",
  ship: "Ship",
};

/** Tailwind dot color for a stage chip by state. */
export function stageStateClass(state: StageState): string {
  switch (state) {
    case "done":
      return "bg-lime";
    case "current":
      return "bg-purple";
    default:
      return "bg-gray-light";
  }
}

/** Leading glyph for a stage chip by state. */
export function stageStateIcon(state: StageState): string {
  switch (state) {
    case "done":
      return "✓";
    case "current":
      return "▷";
    default:
      return "·";
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run (from `phase2-dashboard/`): `npm run test -- lib/project-status.test.ts`
Expected: PASS (all assertions green).

- [ ] **Step 7: Commit**

```bash
git add phase2-dashboard/lib/types.ts phase2-dashboard/lib/project-status.ts phase2-dashboard/lib/project-status.test.ts
git commit -m "feat: project/stage types + production status metadata"
```

---

## Task 2: Stage chips component

**Files:**
- Rename + rewrite: `phase2-dashboard/components/milestone-chips.tsx` → `phase2-dashboard/components/stage-chips.tsx`

No unit test (presentational, like the original); verified by the build in Task 8.

- [ ] **Step 1: Rename the file**

```bash
git mv phase2-dashboard/components/milestone-chips.tsx phase2-dashboard/components/stage-chips.tsx
```

- [ ] **Step 2: Rewrite `phase2-dashboard/components/stage-chips.tsx`**

Replace the ENTIRE file contents with:

```tsx
import {
  STAGE_LABELS,
  STAGE_ORDER,
  stageStateClass,
  stageStateIcon,
} from "@/lib/project-status";
import type { ProductionStage } from "@/lib/types";

/** Return the project's stages in canonical order, defaulting any missing stage to "upcoming". */
function ordered(stages: ProductionStage[]): ProductionStage[] {
  return STAGE_ORDER.map(
    (key) =>
      stages.find((s) => s.key === key) ?? { key, state: "upcoming" as const },
  );
}

export function StageChips({ stages }: { stages: ProductionStage[] }) {
  return (
    <>
      {ordered(stages).map((s) => (
        <span
          key={s.key}
          className={`inline-flex items-center gap-[6px] text-[0.78rem] font-medium ${
            s.state === "upcoming" ? "text-gray-mid" : "text-gray-dark"
          }`}
        >
          <span
            className={`h-[7px] w-[7px] rounded-full ${stageStateClass(s.state)}`}
          />
          {STAGE_LABELS[s.key]} {stageStateIcon(s.state)}
        </span>
      ))}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add phase2-dashboard/components/stage-chips.tsx
git commit -m "feat: production stage chips component"
```

---

## Task 3: Project card component

**Files:**
- Rename + rewrite: `phase2-dashboard/components/deal-card.tsx` → `phase2-dashboard/components/project-card.tsx`

No unit test (presentational); verified by the build in Task 8.

- [ ] **Step 1: Rename the file**

```bash
git mv phase2-dashboard/components/deal-card.tsx phase2-dashboard/components/project-card.tsx
```

- [ ] **Step 2: Rewrite `phase2-dashboard/components/project-card.tsx`**

Replace the ENTIRE file contents with:

```tsx
import { getProjectStatusMeta } from "@/lib/project-status";
import type { Project } from "@/lib/types";
import { StageChips } from "./stage-chips";
import { StatusPill } from "./status-pill";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const meta = getProjectStatusMeta(project.status);
  const needsAction =
    project.status === "blocked" || project.status === "at_risk";
  const context = project.blocker
    ? project.blocker
    : [project.note, project.nextStep].filter(Boolean).join(" — ");

  return (
    <div
      className={`flex items-center gap-[18px] rounded-[15px] border-l-[5px] bg-white px-[18px] py-4 shadow-[0_4px_14px_rgba(50,35,80,0.05)] ${meta.edgeClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-[9px] flex items-center gap-[11px]">
          <span className="font-display text-[1.02rem] font-bold text-ink">
            {project.name}
          </span>
          <StatusPill
            label={meta.label}
            pillClass={meta.pillClass}
            dotClass={meta.dotClass}
          />
        </div>
        <div className="flex flex-wrap items-center gap-[15px]">
          <StageChips stages={project.stages} />
          {context && (
            <span className="text-[0.78rem] font-medium text-gray-mid">
              · {context}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        className={`flex-none whitespace-nowrap rounded-[10px] px-4 py-[9px] font-display text-[0.8rem] font-semibold ${
          needsAction
            ? "bg-purple text-white"
            : "border-[1.5px] border-[#ebe6dd] bg-white text-purple"
        }`}
      >
        {needsAction ? "Follow up" : "View"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add phase2-dashboard/components/project-card.tsx
git commit -m "feat: project card component"
```

---

## Task 4: Rename payment toast → update toast

**Files:**
- Rename: `phase2-dashboard/components/payment-toast.tsx` → `phase2-dashboard/components/update-toast.tsx`

The component body is generic (takes a `message` string) and its lime styling reads as a positive update — only the file name and export name change.

- [ ] **Step 1: Rename the file**

```bash
git mv phase2-dashboard/components/payment-toast.tsx phase2-dashboard/components/update-toast.tsx
```

- [ ] **Step 2: Rewrite `phase2-dashboard/components/update-toast.tsx`**

Replace the ENTIRE file contents with:

```tsx
export function UpdateToast({ message }: { message: string }) {
  return (
    <div className="mt-[18px] flex items-center gap-[10px] rounded-[13px] border border-[#e2ea9e] bg-[#f1f5ce] px-4 py-3 text-[0.84rem] font-medium text-[#5c6a00]">
      {message}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add phase2-dashboard/components/update-toast.tsx
git commit -m "refactor: rename PaymentToast to UpdateToast"
```

---

## Task 5: Re-author mock data

**Files:**
- Rewrite: `phase2-dashboard/lib/mock-data.ts`

- [ ] **Step 1: Rewrite `phase2-dashboard/lib/mock-data.ts`**

Replace the ENTIRE file contents with:

```ts
import type { Project, ProjectStatusKey } from "./types";

export const projects: Project[] = [
  {
    id: "salt-lake-temple",
    name: "Salt Lake Temple",
    owner: "Joe Z.",
    ownerInitials: "JZ",
    status: "on_track",
    stages: [
      { key: "brick", state: "done" },
      { key: "form", state: "done" },
      { key: "build", state: "current" },
      { key: "qa", state: "upcoming" },
      { key: "ship", state: "upcoming" },
    ],
    note: "Build underway",
    nextStep: "next: QA review",
  },
  {
    id: "acme-corp-q3",
    name: "Acme Corp Q3",
    owner: "Miya A.",
    ownerInitials: "MA",
    status: "at_risk",
    stages: [
      { key: "brick", state: "done" },
      { key: "form", state: "current" },
      { key: "build", state: "upcoming" },
      { key: "qa", state: "upcoming" },
      { key: "ship", state: "upcoming" },
    ],
    note: "Production Form awaiting approval · 3d",
  },
  {
    id: "big-customer-logo",
    name: "Big Customer Logo",
    owner: "Miya A.",
    ownerInitials: "MA",
    status: "blocked",
    stages: [
      { key: "brick", state: "done" },
      { key: "form", state: "done" },
      { key: "build", state: "done" },
      { key: "qa", state: "current" },
      { key: "ship", state: "upcoming" },
    ],
    blocker: "⚠️ QA flagged a color mismatch",
  },
  {
    id: "riverside-plaza",
    name: "Riverside Plaza",
    owner: "Joe Z.",
    ownerInitials: "JZ",
    status: "shipping",
    stages: [
      { key: "brick", state: "done" },
      { key: "form", state: "done" },
      { key: "build", state: "done" },
      { key: "qa", state: "done" },
      { key: "ship", state: "current" },
    ],
    note: "Out for delivery · ETA Fri",
  },
];

function countStatus(status: ProjectStatusKey): number {
  return projects.filter((p) => p.status === status).length;
}

export const summary = {
  inProduction: projects.length,
  onTrack: countStatus("on_track"),
  needsAttention: countStatus("at_risk") + countStatus("blocked"),
  shipping: countStatus("shipping"),
};

export const recentUpdate =
  "📦 Riverside Plaza moved to Shipping — out for delivery today";
```

- [ ] **Step 2: Commit**

```bash
git add phase2-dashboard/lib/mock-data.ts
git commit -m "feat: re-author mock data as in-production projects"
```

---

## Task 6: Rewrite the Pipeline page

**Files:**
- Rewrite: `phase2-dashboard/app/page.tsx`

- [ ] **Step 1: Rewrite `phase2-dashboard/app/page.tsx`**

Replace the ENTIRE file contents with:

```tsx
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { FilterChips } from "@/components/filter-chips";
import { ProjectCard } from "@/components/project-card";
import { UpdateToast } from "@/components/update-toast";
import { projects, summary, recentUpdate } from "@/lib/mock-data";

const PRODUCTION_FILTERS = ["All", "On track", "At risk", "Shipping"] as const;

export default function PipelinePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-[26px] py-[22px]">
        <Topbar
          title="Production Pipeline"
          sub={`Tuesday, June 2 · ${summary.inProduction} in production`}
        />

        <div className="mb-[22px] grid grid-cols-4 gap-[14px]">
          <StatCard
            value={String(summary.inProduction)}
            label="In production"
            icon="▦"
            iconClass="bg-[#efe7fb] text-purple"
          />
          <StatCard
            value={String(summary.onTrack)}
            label="On track"
            icon="↑"
            iconClass="bg-[#f1f5ce] text-[#7c8a00]"
          />
          <StatCard
            value={String(summary.needsAttention)}
            label="Needs attention"
            icon="!"
            iconClass="bg-[#ffe1e5] text-[#c20f2b]"
          />
          <StatCard
            value={String(summary.shipping)}
            label="Shipping"
            icon="→"
            iconClass="bg-[#d7f4f2] text-[#00726e]"
          />
        </div>

        <div className="mb-3 mt-1 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink">
            In production
          </h3>
          <FilterChips filters={PRODUCTION_FILTERS} />
        </div>

        <div className="flex flex-col gap-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>

        <UpdateToast message={recentUpdate} />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add phase2-dashboard/app/page.tsx
git commit -m "feat: reframe Pipeline page as production view"
```

---

## Task 7: Confirm no stale references remain

**Files:** none (search only)

- [ ] **Step 1: Grep for leftover old identifiers/paths**

Run (from `phase2-dashboard/`):
```bash
grep -rn "deal-card\|deal-status\|milestone-chips\|payment-toast\|MilestoneChips\|DealCard\|PaymentToast\|recentPayment\|dealStatusKey\|deriveStatus" app components lib
```
Expected: NO output. If anything prints, it is a stale reference — fix it (it should have been replaced by Tasks 1–6) and re-run until clean. Then `git commit -am "fix: remove stale deal references"` only if a fix was needed.

---

## Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole project**

Run (from `phase2-dashboard/`): `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Run the full test suite**

Run (from `phase2-dashboard/`): `npm run test`
Expected: PASS — `lib/project-status.test.ts` and `lib/invoices.test.ts` both green.

- [ ] **Step 3: Build the static export**

Run (from `phase2-dashboard/`): `npm run build`
Expected: build succeeds; routes include `/` and `/invoices`.

- [ ] **Step 4: Confirm the production wording rendered into the home page**

Run (from `phase2-dashboard/`):
```bash
grep -o "Production Pipeline" out/index.html | head -1
grep -o "Brick Selection" out/index.html | head -1
grep -o "In production" out/index.html | head -1
```
Expected: each prints its string once (the page exported with the new wording and stage chips).

- [ ] **Step 5: Commit (only if Step 1–4 surfaced a fix; otherwise skip — build artifacts are gitignored)**

```bash
git status --short
# only if there are tracked changes:
git commit -am "chore: pipeline production-view verification"
```

---

## Self-Review Notes (for the controller)

- Invoices page (`app/invoices/page.tsx`, `lib/invoices.ts`, `components/invoice-card.tsx`) is intentionally untouched and must still build/test green (Task 8 Steps 2–3 confirm).
- `components/sidebar.tsx`, `components/topbar.tsx`, `components/stat-card.tsx`, `components/status-pill.tsx`, `components/filter-chips.tsx` are unchanged.
- The toast rename (Task 4) is a small addition beyond the spec's explicit wording list — flagged to the user.
