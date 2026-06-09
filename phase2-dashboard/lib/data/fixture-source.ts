import type { Project, ProjectDetail } from "../types";
import type { Invoice } from "../invoices";
import type { DashboardSource } from "./source";
import { projects, projectDetails, invoiceDealName } from "../mock-data";
import { invoices } from "../invoices";

/**
 * `DashboardSource` backed by the in-repo mock data (`lib/mock-data.ts` +
 * `lib/invoices.ts`). This is the default source — used whenever live tokens
 * are absent — and the contract reference the live path is tested against.
 *
 * It owns no state and performs no I/O; methods are async only to satisfy the
 * `DashboardSource` interface (the live implementation does real fetches).
 */
export class FixtureSource implements DashboardSource {
  async getProjects(): Promise<Project[]> {
    return projects;
  }

  async getInvoices(): Promise<Invoice[]> {
    return invoices;
  }

  async getProject(id: string): Promise<ProjectDetail | null> {
    const project = projects.find((p) => p.id === id);
    if (!project) return null;

    const dealName = invoiceDealName(project);
    const linkedInvoices = invoices.filter((inv) => inv.dealName === dealName);
    const meta = projectDetails[id];

    return {
      ...project,
      ...meta,
      invoices: linkedInvoices,
    };
  }
}
