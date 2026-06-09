import type { Project, ProjectDetail } from "../types";
import type { Invoice } from "../invoices";
import { getDataSourceMode } from "../env";
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
 * A `DashboardSource` that defers loading `LiveSource` (and therefore the
 * HubSpot/Teamwork client module graph) until a method is first called.
 *
 * This is the mechanism behind the design spec's hard rule that *fixture mode
 * must never require tokens or import the clients eagerly*: `source.ts` has no
 * top-level `import` of `live-source`, and even in live mode the client graph
 * loads only on the first real read. The resolved instance is memoized.
 */
class LazyLiveSource implements DashboardSource {
  private instance: Promise<DashboardSource> | undefined;

  private resolve(): Promise<DashboardSource> {
    if (!this.instance) {
      // Dynamic import → the clients are pulled in lazily, never at module load.
      this.instance = import("./live-source").then((m) => new m.LiveSource());
    }
    return this.instance;
  }

  async getProjects(): Promise<Project[]> {
    return (await this.resolve()).getProjects();
  }

  async getProject(id: string): Promise<ProjectDetail | null> {
    return (await this.resolve()).getProject(id);
  }

  async getInvoices(): Promise<Invoice[]> {
    return (await this.resolve()).getInvoices();
  }
}

/**
 * Returns the active `DashboardSource`.
 *
 * The mode comes from `getDataSourceMode()` (lib/env.ts), which reports "live"
 * only when DATA_SOURCE=live AND both API tokens are present. In live mode we
 * return a `LazyLiveSource` so the client graph is imported lazily (fixture mode
 * never touches it); otherwise the plain `FixtureSource`. `getSource()` keeps a
 * stable synchronous signature so callers never change.
 */
export function getSource(): DashboardSource {
  if (getDataSourceMode() === "live") {
    return new LazyLiveSource();
  }
  return new FixtureSource();
}
