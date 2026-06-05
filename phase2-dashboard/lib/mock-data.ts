import type { Project, ProjectDetail, ProjectStatusKey } from "./types";

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

/**
 * Per-project detail metadata for the `/deals/[id]` page, keyed by project id.
 *
 * This holds only the *extra* fields that aren't already on the base `Project`
 * (deep-links into HubSpot/Teamwork, client name, due date, history). The
 * associated invoices are linked at read time by matching `Invoice.dealName`
 * to `Project.name` (see `invoiceDealName` below + `FixtureSource.getProject`),
 * so there is a single source of truth for invoice membership.
 *
 * Existing exports (`projects`, `summary`, `recentUpdate`) are intentionally
 * left untouched so the current pages keep working mid-refactor.
 */
export type ProjectDetailMeta = Pick<
  ProjectDetail,
  "hubspotUrl" | "teamworkUrl" | "companyName" | "dueDate" | "history"
>;

export const projectDetails: Record<string, ProjectDetailMeta> = {
  "salt-lake-temple": {
    hubspotUrl: "https://app.hubspot.com/contacts/deals/salt-lake-temple",
    teamworkUrl: "https://bravabrands.teamwork.com/app/projects/salt-lake-temple",
    companyName: "Salt Lake Temple",
    dueDate: "2026-06-12",
    history: [
      { at: "2026-05-12", label: "Design deposit paid" },
      { at: "2026-06-01", label: "P1 milestone paid" },
      { at: "2026-06-04", label: "Moved to Build" },
    ],
  },
  "acme-corp-q3": {
    hubspotUrl: "https://app.hubspot.com/contacts/deals/acme-corp-q3",
    teamworkUrl: "https://bravabrands.teamwork.com/app/projects/acme-corp-q3",
    companyName: "Acme Corp",
    dueDate: "2026-06-20",
    history: [
      { at: "2026-05-28", label: "Design deposit paid" },
      { at: "2026-06-02", label: "Production Form awaiting approval" },
    ],
  },
  "big-customer-logo": {
    hubspotUrl: "https://app.hubspot.com/contacts/deals/big-customer-logo",
    teamworkUrl: "https://bravabrands.teamwork.com/app/projects/big-customer-logo",
    companyName: "Big Customer",
    dueDate: "2026-06-10",
    history: [{ at: "2026-06-03", label: "QA flagged a color mismatch" }],
  },
  "riverside-plaza": {
    hubspotUrl: "https://app.hubspot.com/contacts/deals/riverside-plaza",
    teamworkUrl: "https://bravabrands.teamwork.com/app/projects/riverside-plaza",
    companyName: "Riverside Plaza",
    dueDate: "2026-06-05",
    history: [{ at: "2026-06-05", label: "Out for delivery" }],
  },
};

/**
 * Returns the deal name an invoice is filed under for a given project. The
 * fixtures key invoices by `Invoice.dealName === Project.name`; this helper
 * names that linkage so callers don't re-derive it ad hoc.
 */
export function invoiceDealName(project: Project): string {
  return project.name;
}
