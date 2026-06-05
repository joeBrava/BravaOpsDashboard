/**
 * HubSpot deal + Teamwork project  →  dashboard domain types.
 *
 * This is the second of the two "known unknowns" the design spec isolates here
 * (the first is the stage map). Brava has no Phase-1 payment fields yet
 * (`qbo_*_invoice_paid_at` don't exist), and a deal carries at most a single
 * `qbo_invoice_id`. So invoice membership + paid status are *derived* from the
 * HubSpot `dealstage` + `amount` + `closedate`, under the documented
 * assumptions below. Every guess lives in this one file; when live data shows
 * the real shapes, edit here and nothing else changes.
 *
 * All functions are PURE — they take captured-shape client outputs and a fixed
 * reference clock (so date wording is deterministic) and return plain data. No
 * I/O, no network, no client objects.
 */

import type { Invoice, InvoiceStatus } from "../invoices";
import type { Project, ProductionStage, ProjectStatusKey } from "../types";
import type { HubSpotDeal } from "../clients/hubspot";
import type { TeamworkProject } from "../clients/teamwork";
import { mapTeamworkToStages, type StageMapInput } from "./stage-map";
import { STAGE_LABELS } from "../project-status";

// ---------------------------------------------------------------------------
// Owner directory (hubspot_owner_id → display name + initials)
// ---------------------------------------------------------------------------

/**
 * HubSpot exposes deal owners only by numeric id (`hubspot_owner_id`). The
 * dashboard wants a human name + two-letter avatar initials. HubSpot *does*
 * have an owners API, but resolving it per-deal would add a fan-out of live
 * calls; instead we keep a small static directory of the Brava reps.
 *
 * ASSUMPTION: the rep roster is small and stable, so a hand-maintained map is
 * acceptable. Unknown ids fall back to "Unassigned" / "—" (see `resolveOwner`).
 * When the roster changes, add a line here.
 *
 * NOTE: the ids below are placeholders matched only by the unit fixtures. The
 * real `hubspot_owner_id` values get filled in when live tokens are wired
 * (Task B4) — that is a data edit, not a code change.
 */
export const OWNER_DIRECTORY: Record<
  string,
  { name: string; initials: string }
> = {
  "41000001": { name: "Joe Zautner", initials: "JZ" },
  "41000002": { name: "Miya Anderson", initials: "MA" },
};

const UNASSIGNED_OWNER = { name: "Unassigned", initials: "—" } as const;

/** Resolve a HubSpot owner id to a display name + initials, fail-soft. */
function resolveOwner(ownerId: string | null | undefined): {
  name: string;
  initials: string;
} {
  if (!ownerId) return { ...UNASSIGNED_OWNER };
  return { ...(OWNER_DIRECTORY[ownerId] ?? UNASSIGNED_OWNER) };
}

// ---------------------------------------------------------------------------
// dealToInvoices
// ---------------------------------------------------------------------------

/**
 * The three billing milestones every Brava job is split into, in billing order.
 * `key` is the stable id suffix; `lineItem` is the display label; `share` is the
 * fraction of the deal `amount` invoiced at that milestone.
 *
 * ASSUMPTION (amount split): Brava bills 20% design deposit up front, then two
 * 40% production milestones (P1, P2). This 20/40/40 split is the documented
 * default; the remainder from rounding is absorbed by the final milestone so
 * the three invoices always re-sum to the exact deal total.
 */
const MILESTONES = [
  { key: "design", lineItem: "Design deposit", share: 0.2 },
  { key: "p1", lineItem: "P1 milestone", share: 0.4 },
  { key: "p2", lineItem: "P2 milestone", share: 0.4 },
] as const;

/**
 * Per-dealstage paid/pending/unpaid status for [design, P1, P2].
 *
 * ASSUMPTION (paid status): with no real payment timestamps available, we infer
 * collection progress from the deal's pipeline stage:
 *   - `appointmentscheduled` / early stages → nothing billed yet → all unpaid.
 *   - `contractsent` → the contract is signed: the design deposit has cleared
 *     (paid), P1 is invoiced and awaiting payment (pending), P2 not yet billed
 *     (unpaid).
 *   - `closedwon` → the job is won and fully collected → all paid.
 *   - `closedlost` → the deal is dead; assume nothing was collected → all unpaid.
 * Any unrecognized stage conservatively maps to all-unpaid (see DEFAULT_STATUSES)
 * so we never over-report revenue as collected.
 *
 * Keys are HubSpot's default deal-pipeline internal stage names. Brava's real
 * pipeline may use custom stage ids; remap here once verified against live data.
 */
const STAGE_STATUSES: Record<
  string,
  [InvoiceStatus, InvoiceStatus, InvoiceStatus]
> = {
  appointmentscheduled: ["unpaid", "unpaid", "unpaid"],
  qualifiedtobuy: ["unpaid", "unpaid", "unpaid"],
  presentationscheduled: ["pending", "unpaid", "unpaid"],
  decisionmakerboughtin: ["pending", "unpaid", "unpaid"],
  contractsent: ["paid", "pending", "unpaid"],
  closedwon: ["paid", "paid", "paid"],
  closedlost: ["unpaid", "unpaid", "unpaid"],
};

/** Conservative default for an unrecognized dealstage: nothing collected. */
const DEFAULT_STATUSES: [InvoiceStatus, InvoiceStatus, InvoiceStatus] = [
  "unpaid",
  "unpaid",
  "unpaid",
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DealToInvoicesOptions {
  /** Reference "now" for relative due wording; defaults to the real clock. */
  now?: Date;
}

/** Parse a HubSpot string-amount to a non-negative integer dollar value. */
function parseAmount(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Split a whole-dollar total across MILESTONES by `share`, rounding each but the
 * last to the nearest dollar and absorbing the remainder into the last so the
 * parts sum exactly to `total`.
 */
function splitAmount(total: number): number[] {
  const out: number[] = [];
  let allocated = 0;
  MILESTONES.forEach((m, i) => {
    if (i === MILESTONES.length - 1) {
      out.push(total - allocated); // remainder → final milestone (exact sum)
    } else {
      const part = Math.round(total * m.share);
      out.push(part);
      allocated += part;
    }
  });
  return out;
}

/** Truncate a Date to UTC midnight (so wording depends on the calendar day, not the time of day). */
function utcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Whole-day difference (now − due) on the **calendar date** (both truncated to
 * UTC midnight); positive = overdue, negative = future. Using calendar days
 * keeps "N days overdue" / "due in N days" stable regardless of the time of
 * day on `now`.
 */
function daysBetween(now: Date, due: Date): number {
  return Math.round((utcMidnight(now) - utcMidnight(due)) / MS_PER_DAY);
}

/**
 * Build the trailing due note for one invoice.
 * ASSUMPTION (wording, mirrors the existing fixtures in lib/invoices.ts):
 *   - paid    → "Paid"
 *   - pending → "Invoiced" (billed, awaiting payment; due date not surfaced)
 *   - unpaid  → relative to the due date: "N days overdue" / "due in N days"
 *     / "due today". With no due date we say "Not yet invoiced".
 * Returns `{ dueNote, overdue }`; `overdue` is set only for past-due unpaid.
 */
function dueNoteFor(
  status: InvoiceStatus,
  dueDate: Date | null,
  now: Date,
): { dueNote: string; overdue?: boolean } {
  if (status === "paid") return { dueNote: "Paid" };
  if (status === "pending") return { dueNote: "Invoiced" };
  // unpaid
  if (!dueDate) return { dueNote: "Not yet invoiced" };
  const overdueDays = daysBetween(now, dueDate);
  if (overdueDays > 0) {
    return { dueNote: `${overdueDays} days overdue`, overdue: true };
  }
  if (overdueDays === 0) return { dueNote: "due today" };
  return { dueNote: `due in ${-overdueDays} days` };
}

/**
 * Derive the three milestone invoices for a HubSpot deal.
 *
 * Invoice id rules:
 *   - The design deposit takes the deal's `qbo_invoice_id` when present (a deal
 *     holds at most one QBO invoice id, and the deposit is the first thing
 *     billed). When absent, ids are synthetic: `<dealId>-design|p1|p2`.
 *   - P1/P2 always use the synthetic suffix id (no per-milestone QBO id exists).
 *
 * `dealName` falls back to "Untitled deal" if the deal has no `dealname`.
 * `dueDate` for the relative wording comes from the deal `closedate`.
 */
export function dealToInvoices(
  deal: HubSpotDeal,
  options: DealToInvoicesOptions = {},
): Invoice[] {
  const now = options.now ?? new Date();
  const props = deal.properties;
  const dealName = props.dealname ?? "Untitled deal";
  const amount = parseAmount(props.amount);
  const amounts = splitAmount(amount);
  const statuses = STAGE_STATUSES[props.dealstage ?? ""] ?? DEFAULT_STATUSES;
  const qboInvoiceId = props.qbo_invoice_id ?? null;
  const closeDateRaw = props.closedate ?? null;
  const dueDate = closeDateRaw ? new Date(closeDateRaw) : null;
  const validDue = dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null;

  return MILESTONES.map((m, i) => {
    const status = statuses[i];
    const id =
      m.key === "design" && qboInvoiceId
        ? qboInvoiceId
        : `${deal.id}-${m.key}`;
    const { dueNote, overdue } = dueNoteFor(status, validDue, now);
    const invoice: Invoice = {
      id,
      dealName,
      lineItem: m.lineItem,
      amount: amounts[i],
      status,
      dueNote,
    };
    if (overdue) invoice.overdue = true;
    return invoice;
  });
}

// ---------------------------------------------------------------------------
// projectFrom
// ---------------------------------------------------------------------------

export interface ProjectFromOptions {
  /** Short context line shown on the card (free text from a notes source). */
  note?: string;
  /** Explicit "next: …" line; defaults to the current stage's label. */
  nextStep?: string;
  /** Blocker text; its presence forces status → "blocked" (⚠️ prefixed). */
  blocker?: string;
  /** Reference "now" for the overdue-driven at_risk heuristic. */
  now?: Date;
}

/**
 * Status heuristic (in priority order):
 *   1. An explicit `blocker` → "blocked".
 *   2. The pipeline is on the final `ship` stage → "shipping".
 *   3. Any unpaid invoice is past due (overdue) → "at_risk".
 *   4. Otherwise → "on_track".
 *
 * ASSUMPTION: HubSpot/Teamwork carry no single "project health" field, so health
 * is composed from the two signals we *do* have — production progress (stages)
 * and billing health (overdue invoices) — plus an out-of-band blocker note.
 */
function deriveStatus(
  stages: ProductionStage[],
  invoices: Invoice[],
  blocker: string | undefined,
): ProjectStatusKey {
  if (blocker) return "blocked";
  const current = stages.find((s) => s.state === "current");
  if (current?.key === "ship") return "shipping";
  if (invoices.some((i) => i.overdue)) return "at_risk";
  return "on_track";
}

/**
 * Map a HubSpot deal + Teamwork project (+ derived stage items) to a `Project`.
 *
 * The deal is the source of truth for name + owner; the Teamwork project (via
 * the stage items the caller extracts from its tasklists/milestones) drives the
 * stage pipeline. `twProject` itself is currently unused beyond documenting the
 * dependency, but is part of the signature so `projectDetailFrom` and the
 * LiveSource (B4) pass a single consistent shape.
 *
 * `nextStep` defaults to "next: <current stage label>" when not supplied.
 */
export function projectFrom(
  deal: HubSpotDeal,
  // `twProject` is part of the stable mapper signature (so `projectDetailFrom`
  // and the LiveSource pass one consistent shape) but is currently unread here:
  // stages come from the pre-extracted `stageInput`. Prefixed with `_` so lint
  // treats it as intentionally unused.
  _twProject: TeamworkProject | null,
  stageInput: StageMapInput,
  options: ProjectFromOptions = {},
): Project {
  const props = deal.properties;
  const owner = resolveOwner(props.hubspot_owner_id);
  const stages = mapTeamworkToStages(stageInput);
  const invoices = dealToInvoices(deal, { now: options.now });
  const status = deriveStatus(stages, invoices, options.blocker);

  const currentStage = stages.find((s) => s.state === "current");
  const nextStep =
    options.nextStep ??
    (currentStage ? `next: ${STAGE_LABELS[currentStage.key]}` : undefined);

  const project: Project = {
    id: deal.id,
    name: props.dealname ?? "Untitled deal",
    owner: owner.name,
    ownerInitials: owner.initials,
    status,
    stages,
  };
  if (options.note !== undefined) project.note = options.note;
  if (nextStep !== undefined) project.nextStep = nextStep;
  if (options.blocker !== undefined) {
    // Prefix the ⚠️ glyph here so callers pass plain text (matches fixtures).
    project.blocker = `⚠️ ${options.blocker}`;
  }
  return project;
}

// ---------------------------------------------------------------------------
// projectDetailFrom
// ---------------------------------------------------------------------------

/** Default Teamwork host for deep-links (matches env.teamworkDomain default). */
const DEFAULT_TEAMWORK_DOMAIN = "bravabrands.teamwork.com";

export interface ProjectDetailFromOptions extends ProjectFromOptions {
  /** Client/company display name; defaults to the deal name. */
  companyName?: string;
  /** Teamwork host for the deep-link; defaults to DEFAULT_TEAMWORK_DOMAIN. */
  teamworkDomain?: string;
  /** Activity log entries for the detail timeline. */
  history?: { at: string; label: string }[];
}

/** HubSpot deep-link to a deal record (portal id `0` resolves to the user's). */
function hubspotDealUrl(dealId: string): string {
  return `https://app.hubspot.com/contacts/0/deal/${dealId}`;
}

/** Teamwork deep-link to a project on the given host. */
function teamworkProjectUrl(domain: string, projectId: string | number): string {
  return `https://${domain}/app/projects/${projectId}`;
}

/**
 * Map a HubSpot deal + (optional) Teamwork project to a `ProjectDetail`: the
 * base `Project` enriched with its derived invoices, source-system deep-links,
 * company name, due date, and optional history.
 *
 * The Teamwork project is optional: a deal may exist before its production
 * project does. When `twProject` is null, `teamworkUrl` is omitted; stages still
 * derive from the supplied `stageInput` (which the caller may build empty).
 */
export function projectDetailFrom(
  deal: HubSpotDeal,
  twProject: TeamworkProject | null,
  stageInput: StageMapInput,
  options: ProjectDetailFromOptions = {},
): import("../types").ProjectDetail {
  const base = projectFrom(deal, twProject, stageInput, options);
  const props = deal.properties;
  const domain = options.teamworkDomain ?? DEFAULT_TEAMWORK_DOMAIN;

  const detail: import("../types").ProjectDetail = {
    ...base,
    invoices: dealToInvoices(deal, { now: options.now }),
    hubspotUrl: hubspotDealUrl(deal.id),
    companyName: options.companyName ?? props.dealname ?? "Untitled deal",
  };
  if (twProject) {
    detail.teamworkUrl = teamworkProjectUrl(domain, twProject.id);
  }
  if (props.closedate) detail.dueDate = props.closedate;
  if (options.history) detail.history = options.history;
  return detail;
}
