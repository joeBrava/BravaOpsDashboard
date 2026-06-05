import type { Project, ProjectDetail } from "@/lib/types";
import type { Invoice } from "@/lib/invoices";
import { getDataSourceMode } from "@/lib/env";
import { FixtureSource } from "./fixture-source";

/**
 * The single read-only data contract every page/route handler consumes.
 *
 * Two implementations sit behind this interface:
 *   - `FixtureSource` — today's mock data (Task A4).
 *   - `LiveSource`    — read-only HubSpot + Teamwork via clients + mappers (Task B4).
 *
 * Pages never import a concrete source directly; they go through `getSource()`
 * so flipping fixture↔live is a single env change.
 */
export interface DashboardSource {
  /** all projects for the Pipeline view */
  getProjects(): Promise<Project[]>;
  /** one project enriched for `/deals/[id]`, or null when not found */
  getProject(id: string): Promise<ProjectDetail | null>;
  /** all invoices for the Invoices view */
  getInvoices(): Promise<Invoice[]>;
}

/**
 * Returns the active `DashboardSource`.
 *
 * The mode comes from `getDataSourceMode()` (lib/env.ts), which reports "live"
 * only when DATA_SOURCE=live AND both API tokens are present. `LiveSource` is
 * wired into the live branch in Task B4; until then every mode resolves to
 * fixtures. `getSource()` keeps a stable signature so callers never change.
 */
export function getSource(): DashboardSource {
  // Resolved up front so the live branch can be wired in B4 without touching
  // this signature. Today both modes return fixtures.
  void getDataSourceMode();
  return new FixtureSource();
}
