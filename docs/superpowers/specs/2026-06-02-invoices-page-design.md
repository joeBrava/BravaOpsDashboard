# Invoices Page — Design

**Date:** 2026-06-02
**Status:** Approved
**Scope:** Add a static, look-only Invoices page to the phase2-dashboard, reachable from the sidebar.

## Goal

The sidebar already lists an **Invoices** tab (with a "2" badge) but it has no page.
Build a static Invoices page that previews what the tab will look like, matching the
existing Pipeline page's visual language. Look-only — no real interactivity or backend.

## Route & Navigation

- New route `app/invoices/page.tsx`. Under `output: "export"` this emits
  `out/invoices/index.html`, served at `/BravaOpsDashboard/invoices/`.
- Make the sidebar navigate (it currently renders static divs):
  - Convert `components/sidebar.tsx` to a client component (`"use client"`) using
    `usePathname()` to derive the active state.
  - **Pipeline → `/`**, **Invoices → `/invoices`** via `next/link`.
  - "All deals", "Team view", "Settings" remain non-navigating items (no routes built yet).
  - `next/link` applies `basePath` automatically; `usePathname()` returns the path
    *without* basePath, so the active check is `pathname === "/invoices"` etc.

## Data — `lib/invoices.ts` (standalone, hand-authored)

New `Invoice` type:

```ts
export type InvoiceStatus = "unpaid" | "pending" | "paid";

export interface Invoice {
  id: string;          // e.g. "1042"
  dealName: string;    // e.g. "Big Customer Logo"
  lineItem: string;    // e.g. "Design deposit", "P1 milestone"
  amount: number;      // dollars, formatted at render
  status: InvoiceStatus;
  dueNote: string;     // e.g. "8 days overdue", "due in 5 days", "paid May 28"
  overdue?: boolean;   // true for past-due unpaid invoices
}
```

- ~6 hand-authored records spanning all three statuses (at least 2 overdue, to match
  the sidebar "2" badge; at least 1 pending; the rest paid).
- `invoiceSummary` is **derived from the records**, not hardcoded:
  - `outstanding` = Σ amount where status is `unpaid` or `pending`
  - `overdue` = count where `overdue === true`
  - `paidThisMonth` = Σ amount where status is `paid`
- A money formatter helper (e.g. `formatUsd(n: number): string` → `"$11,000"`).

## Components

- **New `components/invoice-card.tsx`** — mirrors `DealCard`'s visual language:
  - White card, rounded, soft shadow, colored left edge by status:
    overdue → `danger`, pending → `gold`, paid → `teal`.
  - `StatusPill` (reused) with label "Unpaid" / "Pending" / "Paid".
  - Body: invoice `#id` + `dealName`, then `{lineItem} · {amount} · {dueNote}`.
  - Right-side button: "Send reminder" when `overdue`, else "View" (decorative).
  - Local status-meta map (label / edgeClass / pillClass / dotClass) reusing existing
    Tailwind color tokens — same pattern as `deal-status.ts`, kept separate so invoices
    and deals stay decoupled.
- **`components/filter-chips.tsx`** — add optional `filters?: readonly string[]` prop,
  defaulting to the current Pipeline list (`["All", "Ready", "Blocked"]`). Invoices
  passes `["All", "Overdue", "Pending", "Paid"]`. Still presentational (first chip active).
- Reuse `StatCard`, `Topbar`, `Sidebar`, `StatusPill` unchanged (besides the sidebar
  navigation change above).

## Page Layout — `app/invoices/page.tsx`

Same container/spacing as the Pipeline page:

- `Sidebar`
- `<main>` with:
  - `Topbar title="Invoices" sub="Tuesday, June 2 · 2 overdue"`
  - 3-up `StatCard` summary row: **Outstanding** (`$ outstanding`), **Overdue**
    (count), **Paid this month** (`$ paidThisMonth`).
  - Header row: `Invoices` heading + `FilterChips` (invoice filters).
  - Mapped `InvoiceCard` list.

## Testing

- `lib/invoices.test.ts` (vitest, matching `lib/deal-status.test.ts`): assert the
  derived `invoiceSummary` totals/counts match the hand-authored records, and that
  `formatUsd` formats correctly.

## Out of Scope (YAGNI)

- Real filtering interactivity.
- Invoice detail / document view.
- Routes for All deals / Team view / Settings.
- Any backend or data fetching.

## Verification

- `npm run test` passes.
- `npm run build` succeeds and produces `out/invoices/index.html` with assets prefixed
  `/BravaOpsDashboard/`.
- Sidebar navigates between `/` and `/invoices`, with the correct item highlighted.
