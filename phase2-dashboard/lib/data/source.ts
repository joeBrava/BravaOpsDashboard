import type { Project, ProjectDetail } from "@/lib/types";
import type { Invoice } from "@/lib/invoices";
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
 * Resolved data-source mode.
 *
 * NOTE: Task A2 introduces the canonical `getDataSourceMode()` in `lib/env.ts`
 * (typed env access, auto-degrade to fixture when tokens are absent). Until that
 * lands and `getSource()` is rewired to import it, we resolve the mode locally
 * from `DATA_SOURCE` and only ever build a fixture source here — `LiveSource`
 * is wired into the selector in Task B4.
 */
type DataSourceMode = "fixture" | "live";

function resolveMode(): DataSourceMode {
  return process.env.DATA_SOURCE === "live" ? "live" : "fixture";
}

/**
 * Returns the active `DashboardSource`.
 *
 * For now this always returns a fixture-backed source (LiveSource is added in
 * Task B4; the `FixtureSource` concrete class — `lib/data/fixture-source.ts` —
 * is wired in here as of Task A4). `getSource()` keeps a stable signature so
 * the live branch can be added in B4 without touching callers.
 */
export function getSource(): DashboardSource {
  // mode is resolved up front so the live branch can be wired in B4 without
  // changing this signature; today every mode resolves to fixtures.
  void resolveMode();
  return new FixtureSource();
}
