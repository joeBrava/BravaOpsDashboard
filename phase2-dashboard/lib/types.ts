import type { Invoice } from "./invoices";

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

/**
 * A single project enriched for the `/deals/[id]` detail page: the base
 * `Project` plus its associated invoices and deep-links into the source systems.
 *
 * Minimal shape introduced with the `DashboardSource` adapter (Task A3). The
 * detail fixtures + full metadata (companyName, dueDate, history) are layered
 * on in Task D1; fields stay optional so that extension is non-breaking.
 */
export interface ProjectDetail extends Project {
  /** invoices associated with this deal/project */
  invoices: Invoice[];
  /** deep-link to the HubSpot deal */
  hubspotUrl?: string;
  /** deep-link to the Teamwork project */
  teamworkUrl?: string;
  /** HubSpot company / client name */
  companyName?: string;
  /** ISO date the project/next milestone is due */
  dueDate?: string;
  /** lightweight activity log for the timeline */
  history?: { at: string; label: string }[];
}
