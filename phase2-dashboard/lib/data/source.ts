import type { Project, ProjectDetail } from "@/lib/types";
import type { Invoice } from "@/lib/invoices";

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
 * Task B4; the `FixtureSource` concrete class arrives in Task A4 and will be
 * imported here, lazily, so fixture mode never pulls in live clients/tokens).
 */
export function getSource(): DashboardSource {
  // mode is resolved up front so the live branch can be wired in B4 without
  // changing this signature; today every mode resolves to fixtures.
  void resolveMode();
  return fixtureSource;
}

// ---------------------------------------------------------------------------
// Temporary inline fixture source.
//
// This is a minimal, contract-complete stand-in so `source.ts` compiles and
// `getSource()` works on its own ahead of Task A4. Task A4 replaces this with
// the real, unit-tested `FixtureSource` in `lib/data/fixture-source.ts` and
// changes `getSource()` to import it.
// ---------------------------------------------------------------------------
const fixtureSource: DashboardSource = {
  async getProjects(): Promise<Project[]> {
    const { projects } = await import("@/lib/mock-data");
    return projects;
  },
  async getProject(id: string): Promise<ProjectDetail | null> {
    const [{ projects }, { invoices }] = await Promise.all([
      import("@/lib/mock-data"),
      import("@/lib/invoices"),
    ]);
    const project = projects.find((p) => p.id === id);
    if (!project) return null;
    return {
      ...project,
      invoices: invoices.filter((inv) => inv.dealName === project.name),
    };
  },
  async getInvoices(): Promise<Invoice[]> {
    const { invoices } = await import("@/lib/invoices");
    return invoices;
  },
};
