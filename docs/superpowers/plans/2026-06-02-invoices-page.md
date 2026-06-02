# Invoices Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static, look-only Invoices page to the phase2-dashboard, reachable from the sidebar, matching the existing Pipeline page's visual language.

**Architecture:** A new App Router route `app/invoices/page.tsx` renders a standalone mock invoice data set (`lib/invoices.ts`) as status-colored cards that mirror the existing deal cards. A derived summary feeds three reused `StatCard`s. The sidebar becomes a client component that navigates between `/` and `/invoices` via `next/link`.

**Tech Stack:** Next.js 16 (App Router, `output: "export"`), React 19, Tailwind CSS v4, TypeScript, Vitest.

---

## File Structure

- **Create `lib/invoices.ts`** — `Invoice` type, `InvoiceStatus`, the hand-authored `invoices` array, a derived `invoiceSummary`, the `invoiceStatusMeta()` map, and a `formatUsd()` helper. Owns all invoice data + presentation metadata, mirroring how `lib/deal-status.ts` owns deal status metadata.
- **Create `lib/invoices.test.ts`** — unit tests for `formatUsd`, `invoiceSummary`, and `invoiceStatusMeta`.
- **Create `components/invoice-card.tsx`** — presentational card for one invoice, mirroring `components/deal-card.tsx`.
- **Modify `components/filter-chips.tsx`** — accept an optional `filters` prop (default = current Pipeline list).
- **Modify `components/sidebar.tsx`** — client component; Pipeline/Invoices items become `next/link`s with active state from `usePathname()`.
- **Create `app/invoices/page.tsx`** — assembles the page.

---

## Task 1: Invoice data layer (`lib/invoices.ts`) + tests

**Files:**
- Create: `lib/invoices.ts`
- Test: `lib/invoices.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/invoices.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  invoices,
  invoiceSummary,
  invoiceStatusMeta,
  formatUsd,
} from "./invoices";
import type { InvoiceStatus } from "./invoices";

describe("formatUsd", () => {
  it("formats with thousands separators and a leading $", () => {
    expect(formatUsd(11000)).toBe("$11,000");
    expect(formatUsd(2500)).toBe("$2,500");
    expect(formatUsd(0)).toBe("$0");
  });
});

describe("invoiceSummary", () => {
  it("outstanding sums every non-paid invoice", () => {
    const expected = invoices
      .filter((i) => i.status !== "paid")
      .reduce((s, i) => s + i.amount, 0);
    expect(invoiceSummary.outstanding).toBe(expected);
  });

  it("overdue counts invoices flagged overdue", () => {
    const expected = invoices.filter((i) => i.overdue).length;
    expect(invoiceSummary.overdue).toBe(expected);
  });

  it("paidThisMonth sums every paid invoice", () => {
    const expected = invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.amount, 0);
    expect(invoiceSummary.paidThisMonth).toBe(expected);
  });

  it("computes the expected totals for the seeded data", () => {
    expect(invoiceSummary.outstanding).toBe(11000);
    expect(invoiceSummary.overdue).toBe(2);
    expect(invoiceSummary.paidThisMonth).toBe(8250);
  });
});

describe("invoiceStatusMeta", () => {
  it("maps each status to a label and non-empty classes", () => {
    for (const status of ["unpaid", "pending", "paid"] as InvoiceStatus[]) {
      const meta = invoiceStatusMeta(status);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.edgeClass.length).toBeGreaterThan(0);
      expect(meta.pillClass.length).toBeGreaterThan(0);
      expect(meta.dotClass.length).toBeGreaterThan(0);
    }
  });

  it("uses the danger edge for unpaid and teal edge for paid", () => {
    expect(invoiceStatusMeta("unpaid").edgeClass).toContain("border-l-danger");
    expect(invoiceStatusMeta("paid").edgeClass).toContain("border-l-teal");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/invoices.test.ts`
Expected: FAIL — cannot resolve `./invoices` (module does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `lib/invoices.ts`:

```ts
export type InvoiceStatus = "unpaid" | "pending" | "paid";

export interface Invoice {
  /** invoice number, e.g. "1042" */
  id: string;
  dealName: string;
  /** e.g. "Design deposit", "P1 milestone" */
  lineItem: string;
  /** whole dollars; formatted at render with formatUsd */
  amount: number;
  status: InvoiceStatus;
  /** short trailing note, e.g. "8 days overdue", "due in 5 days", "paid Jun 1" */
  dueNote: string;
  /** true for past-due unpaid invoices */
  overdue?: boolean;
}

export const invoices: Invoice[] = [
  {
    id: "1042",
    dealName: "Big Customer Logo",
    lineItem: "Design deposit",
    amount: 2500,
    status: "unpaid",
    dueNote: "8 days overdue",
    overdue: true,
  },
  {
    id: "1041",
    dealName: "Acme Corp Q3",
    lineItem: "P1 milestone",
    amount: 4250,
    status: "unpaid",
    dueNote: "3 days overdue",
    overdue: true,
  },
  {
    id: "1039",
    dealName: "Salt Lake Temple",
    lineItem: "P2 milestone",
    amount: 4250,
    status: "pending",
    dueNote: "due in 5 days",
  },
  {
    id: "1038",
    dealName: "Salt Lake Temple",
    lineItem: "P1 milestone",
    amount: 4250,
    status: "paid",
    dueNote: "paid Jun 1",
  },
  {
    id: "1036",
    dealName: "Acme Corp Q3",
    lineItem: "Design deposit",
    amount: 2000,
    status: "paid",
    dueNote: "paid May 28",
  },
  {
    id: "1031",
    dealName: "Salt Lake Temple",
    lineItem: "Design deposit",
    amount: 2000,
    status: "paid",
    dueNote: "paid May 12",
  },
];

/** Format whole dollars as "$11,000". */
export function formatUsd(amount: number): string {
  return "$" + amount.toLocaleString("en-US");
}

/** Summary aggregates derived from the invoice list (kept honest, no hardcoding). */
export const invoiceSummary = {
  outstanding: invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0),
  overdue: invoices.filter((i) => i.overdue).length,
  paidThisMonth: invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0),
};

export interface InvoiceStatusMeta {
  label: string;
  /** Tailwind class for the card's left edge color */
  edgeClass: string;
  /** Tailwind classes for the status pill (bg + text) */
  pillClass: string;
  /** Tailwind class for the pill's leading dot */
  dotClass: string;
}

const STATUS_META: Record<InvoiceStatus, InvoiceStatusMeta> = {
  unpaid: {
    label: "Unpaid",
    edgeClass: "border-l-danger",
    pillClass: "bg-[#ffe1e5] text-[#c20f2b]",
    dotClass: "bg-danger",
  },
  pending: {
    label: "Pending",
    edgeClass: "border-l-gold",
    pillClass: "bg-[#fff1c9] text-[#876a00]",
    dotClass: "bg-gold",
  },
  paid: {
    label: "Paid",
    edgeClass: "border-l-teal",
    pillClass: "bg-[#d7f4f2] text-[#00726e]",
    dotClass: "bg-teal",
  },
};

export function invoiceStatusMeta(status: InvoiceStatus): InvoiceStatusMeta {
  return STATUS_META[status];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/invoices.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add phase2-dashboard/lib/invoices.ts phase2-dashboard/lib/invoices.test.ts
git commit -m "feat: invoice mock data, summary, and status metadata"
```

---

## Task 2: Invoice card component (`components/invoice-card.tsx`)

**Files:**
- Create: `components/invoice-card.tsx`

This is a presentational component mirroring `components/deal-card.tsx`. It has no unit test (consistent with the existing `deal-card.tsx`, which has none); it is exercised by the build in Task 6.

- [ ] **Step 1: Write the component**

Create `components/invoice-card.tsx`:

```tsx
import { formatUsd, invoiceStatusMeta } from "@/lib/invoices";
import type { Invoice } from "@/lib/invoices";
import { StatusPill } from "./status-pill";

interface InvoiceCardProps {
  invoice: Invoice;
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const meta = invoiceStatusMeta(invoice.status);
  const needsAction = invoice.overdue ?? false;

  return (
    <div
      className={`flex items-center gap-[18px] rounded-[15px] border-l-[5px] bg-white px-[18px] py-4 shadow-[0_4px_14px_rgba(50,35,80,0.05)] ${meta.edgeClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-[9px] flex items-center gap-[11px]">
          <span className="font-display text-[1.02rem] font-bold text-ink">
            #{invoice.id} · {invoice.dealName}
          </span>
          <StatusPill
            label={meta.label}
            pillClass={meta.pillClass}
            dotClass={meta.dotClass}
          />
        </div>
        <div className="flex flex-wrap items-center gap-[8px] text-[0.78rem] font-medium text-gray-mid">
          <span>{invoice.lineItem}</span>
          <span className="font-display font-bold text-ink">
            {formatUsd(invoice.amount)}
          </span>
          <span>· {invoice.dueNote}</span>
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
        {needsAction ? "Send reminder" : "View"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Type-check the component**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add phase2-dashboard/components/invoice-card.tsx
git commit -m "feat: invoice card component"
```

---

## Task 3: Parametrize filter chips (`components/filter-chips.tsx`)

**Files:**
- Modify: `components/filter-chips.tsx`

- [ ] **Step 1: Replace the component with a prop-driven version**

Replace the entire contents of `components/filter-chips.tsx` with:

```tsx
const DEFAULT_FILTERS = ["All", "Ready", "Blocked"] as const;

export function FilterChips({
  filters = DEFAULT_FILTERS,
}: {
  filters?: readonly string[];
}) {
  return (
    <div className="flex gap-[7px]">
      {filters.map((f, i) => (
        <span
          key={f}
          className={`rounded-full px-3 py-[5px] font-display text-[0.74rem] font-semibold ${
            i === 0
              ? "border border-purple bg-purple text-white"
              : "border border-[#ebe6dd] bg-white text-gray-dark"
          }`}
        >
          {f}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify the Pipeline page still type-checks (it calls `<FilterChips />` with no props)**

Run: `npx tsc --noEmit`
Expected: no errors (the `filters` prop is optional with a default).

- [ ] **Step 3: Commit**

```bash
git add phase2-dashboard/components/filter-chips.tsx
git commit -m "refactor: make FilterChips accept an optional filters prop"
```

---

## Task 4: Sidebar navigation (`components/sidebar.tsx`)

**Files:**
- Modify: `components/sidebar.tsx`

Convert the sidebar to a client component so Pipeline and Invoices navigate via `next/link`, with the active item derived from `usePathname()`. "All deals", "Team view", and "Settings" stay as non-navigating items (no routes built yet).

- [ ] **Step 1: Replace the component**

Replace the entire contents of `components/sidebar.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./brand-mark";

interface NavItem {
  label: string;
  /** present => navigable */
  href?: string;
  badge?: string;
}

const workspace: NavItem[] = [
  { label: "Pipeline", href: "/" },
  { label: "All deals" },
  { label: "Invoices", href: "/invoices", badge: "2" },
];
const team: NavItem[] = [{ label: "Team view" }, { label: "Settings" }];

function Item({ item, active }: { item: NavItem; active: boolean }) {
  const className = `mb-[3px] flex items-center gap-[11px] rounded-[10px] px-3 py-[10px] text-sm font-medium ${
    active ? "bg-white/15 font-semibold text-white" : "text-white/80"
  }`;
  const inner = (
    <>
      <span
        className={`h-[17px] w-[17px] flex-none rounded-[5px] ${
          active ? "bg-lime" : "bg-white/30"
        }`}
      />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-danger px-[7px] py-px text-[0.66rem] font-bold text-white">
          {item.badge}
        </span>
      )}
    </>
  );

  return item.href ? (
    <Link href={item.href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <div className="mx-2 mb-2 mt-[6px] text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-white/45">
      {label}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[212px] flex-none flex-col bg-gradient-to-b from-purple-deep to-[#52218c] px-4 py-[22px] text-white">
      <div className="mb-[30px] flex items-center gap-[10px] pl-1 font-display text-[1.05rem] font-extrabold">
        <BrandMark />
        Biz Bricks
      </div>

      <Section label="Workspace" />
      {workspace.map((i) => (
        <Item key={i.label} item={i} active={i.href === pathname} />
      ))}

      <Section label="Team" />
      {team.map((i) => (
        <Item key={i.label} item={i} active={false} />
      ))}

      <div className="mt-auto flex items-center gap-[10px] border-t border-white/15 px-2 py-[10px]">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white font-display text-[0.76rem] font-bold text-purple-deep">
          JZ
        </span>
        <span className="text-sm leading-tight">
          Joe Zink
          <br />
          <small className="text-[0.7rem] text-white/55">Sales</small>
        </span>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add phase2-dashboard/components/sidebar.tsx
git commit -m "feat: sidebar navigates between Pipeline and Invoices"
```

---

## Task 5: Invoices page (`app/invoices/page.tsx`)

**Files:**
- Create: `app/invoices/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/invoices/page.tsx`:

```tsx
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { FilterChips } from "@/components/filter-chips";
import { InvoiceCard } from "@/components/invoice-card";
import { invoices, invoiceSummary, formatUsd } from "@/lib/invoices";

const INVOICE_FILTERS = ["All", "Overdue", "Pending", "Paid"] as const;

export default function InvoicesPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-[26px] py-[22px]">
        <Topbar
          title="Invoices"
          sub={`Tuesday, June 2 · ${invoiceSummary.overdue} overdue`}
        />

        <div className="mb-[22px] grid grid-cols-3 gap-[14px]">
          <StatCard
            value={formatUsd(invoiceSummary.outstanding)}
            label="Outstanding"
            icon="$"
            iconClass="bg-[#efe7fb] text-purple"
          />
          <StatCard
            value={String(invoiceSummary.overdue)}
            label="Overdue"
            icon="!"
            iconClass="bg-[#ffe1e5] text-[#c20f2b]"
          />
          <StatCard
            value={formatUsd(invoiceSummary.paidThisMonth)}
            label="Paid this month"
            icon="✓"
            iconClass="bg-[#d7f4f2] text-[#00726e]"
          />
        </div>

        <div className="mb-3 mt-1 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink">Invoices</h3>
          <FilterChips filters={INVOICE_FILTERS} />
        </div>

        <div className="flex flex-col gap-3">
          {invoices.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add phase2-dashboard/app/invoices/page.tsx
git commit -m "feat: assemble static Invoices page"
```

---

## Task 6: Full verification (tests + static export)

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: PASS — both `lib/deal-status.test.ts` and `lib/invoices.test.ts` green.

- [ ] **Step 2: Build the static export**

Run: `npm run build`
Expected: build succeeds; route list includes both `/` and `/invoices`.

- [ ] **Step 3: Confirm the Invoices page exported with the correct basePath**

Run: `ls out/invoices/index.html && grep -o "/BravaOpsDashboard/_next[^\"']*" out/invoices/index.html | head -1`
Expected: `out/invoices/index.html` exists and asset paths are prefixed with `/BravaOpsDashboard/`.

- [ ] **Step 4: Commit (if any build-config or lockfile changes appeared — otherwise skip)**

```bash
git status --short
# Only if there are tracked changes:
git commit -am "chore: invoices page build verification"
```

---

## Notes for the implementer

- All commands run from inside `phase2-dashboard/` (where `package.json` lives). Git `add` paths above are written relative to the repo root; adjust to your shell's working directory.
- The app uses `output: "export"` with `basePath: "/BravaOpsDashboard"`. `next/link` applies the basePath automatically, and `usePathname()` returns paths *without* the basePath — so `i.href === pathname` correctly matches `/` and `/invoices`.
- Tailwind color tokens (`danger`, `gold`, `teal`, `lime`, `purple`, etc.) are defined in `app/globals.css` under `@theme`. `border-l-gold` and `border-l-danger` are already in use; `border-l-teal` uses the same `--color-teal` token.
- This is a look-only page: filter chips and the card buttons are decorative (no click handlers), consistent with the Pipeline page.
