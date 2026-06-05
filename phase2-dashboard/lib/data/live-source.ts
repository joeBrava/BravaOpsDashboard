/**
 * `LiveSource` — the read-only live implementation of `DashboardSource`.
 *
 * It fans HubSpot deals (the source of truth for name/owner/amount/stage/billing
 * derivation) and their associated Teamwork projects (production progress) through
 * the pure B3 mappers (`projectFrom`, `projectDetailFrom`, `dealToInvoices`) and
 * the B2 stage map. Clients are read-only by construction (Task B1).
 *
 * Failure policy — NEVER throw up to a page (the design spec's hard requirement):
 *   - A top-level HubSpot failure (can't list/get deals) logs and returns an
 *     empty result (`[]` / `null`).
 *   - A per-deal Teamwork failure (one project can't be fetched) logs and falls
 *     back to empty stage input for that deal — the rest of the list is kept.
 *     This is graceful *partial* degradation, not an all-or-nothing crash.
 *
 * Clients are injected (the test passes mocks); the no-arg / env path is only
 * taken in production via `getSource()` when `getDataSourceMode()==="live"`,
 * which already guarantees both tokens are present.
 */

import type { Project, ProjectDetail } from "../types";
import type { Invoice } from "../invoices";
import type { DashboardSource } from "./source";
import {
  createHubSpotClient,
  type HubSpotClient,
  type HubSpotDeal,
} from "../clients/hubspot";
import {
  createTeamworkClient,
  type TeamworkClient,
  type TeamworkProject,
} from "../clients/teamwork";
import { env } from "../env";
import {
  dealToInvoices,
  projectFrom,
  projectDetailFrom,
} from "./mappers";
import type { StageMapInput, StageInputItem } from "./stage-map";

/**
 * HubSpot deal properties the live mappers read. Requested explicitly so the
 * `properties` map the client hydrates contains exactly what the mappers expect
 * (HubSpot only returns requested properties; absent ones map to `null`).
 *
 * `teamwork_project_id` is the deal custom field that points at the production
 * project in Teamwork. If Brava names this field differently in live data, edit
 * `TEAMWORK_PROJECT_ID_PROP` below — that is a one-line change.
 */
const DEAL_PROPERTIES = [
  "dealname",
  "dealstage",
  "amount",
  "hubspot_owner_id",
  "closedate",
  "qbo_invoice_id",
  "teamwork_project_id",
];

/** Deal property holding the linked Teamwork project id (see note above). */
const TEAMWORK_PROJECT_ID_PROP = "teamwork_project_id";

/** Empty stage input — used when a deal has no/failed Teamwork project. */
const EMPTY_STAGE_INPUT: StageMapInput = { items: [] };

export interface LiveSourceDeps {
  hubspot: HubSpotClient;
  teamwork: TeamworkClient;
  /** Reference "now" for deterministic relative due-date wording (tests). */
  now?: Date;
}

/**
 * Build a `LiveSource` from env tokens. Only called by `getSource()` in live
 * mode, where `getDataSourceMode()` has already confirmed both tokens exist;
 * the `??""` is a belt-and-braces fallback so construction can never throw.
 */
function depsFromEnv(): LiveSourceDeps {
  return {
    hubspot: createHubSpotClient(env.hubspotToken() ?? ""),
    teamwork: createTeamworkClient(env.teamworkDomain(), env.teamworkToken() ?? ""),
  };
}

/**
 * Reduce a Teamwork v3 project to the tasklist/milestone name+completion items
 * the stage map consumes. The v3 project shape is permissive, so this reads
 * defensively: it looks at `tasklists` and `milestones` arrays (the two signals
 * the stage map keys off), tolerating either a boolean `completed` or a v3-style
 * `status: "completed"` field, and skips anything malformed. Never throws.
 */
export function stageInputFromTeamwork(
  twProject: TeamworkProject | null,
): StageMapInput {
  if (!twProject) return EMPTY_STAGE_INPUT;
  const items: StageInputItem[] = [];

  const collect = (raw: unknown) => {
    if (!Array.isArray(raw)) return;
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const rec = entry as Record<string, unknown>;
      const name = typeof rec.name === "string" ? rec.name : undefined;
      if (!name) continue;
      const completed =
        rec.completed === true ||
        (typeof rec.status === "string" &&
          rec.status.toLowerCase() === "completed");
      items.push({ name, completed });
    }
  };

  collect((twProject as Record<string, unknown>).tasklists);
  collect((twProject as Record<string, unknown>).milestones);
  return { items };
}

export class LiveSource implements DashboardSource {
  private readonly hubspot: HubSpotClient;
  private readonly teamwork: TeamworkClient;
  private readonly now?: Date;

  constructor(deps: LiveSourceDeps = depsFromEnv()) {
    this.hubspot = deps.hubspot;
    this.teamwork = deps.teamwork;
    this.now = deps.now;
  }

  /**
   * Best-effort fetch of the Teamwork project linked to a deal. Returns null
   * (never throws) when there is no link or the fetch fails — the caller falls
   * back to empty stage input, so one bad project never breaks the page.
   */
  private async fetchTeamworkProject(
    deal: HubSpotDeal,
  ): Promise<TeamworkProject | null> {
    const twId = deal.properties[TEAMWORK_PROJECT_ID_PROP];
    if (!twId) return null;
    try {
      return await this.teamwork.getProject(twId);
    } catch (err) {
      console.error(
        `[LiveSource] Teamwork getProject(${twId}) failed for deal ${deal.id}; continuing without stages.`,
        err,
      );
      return null;
    }
  }

  async getProjects(): Promise<Project[]> {
    let deals: HubSpotDeal[];
    try {
      deals = await this.hubspot.listDeals({ properties: DEAL_PROPERTIES });
    } catch (err) {
      console.error(
        "[LiveSource] getProjects: HubSpot listDeals failed; returning empty pipeline.",
        err,
      );
      return [];
    }

    const projects = await Promise.all(
      deals.map(async (deal) => {
        const twProject = await this.fetchTeamworkProject(deal);
        const stageInput = stageInputFromTeamwork(twProject);
        return projectFrom(deal, twProject, stageInput, { now: this.now });
      }),
    );
    return projects;
  }

  async getInvoices(): Promise<Invoice[]> {
    let deals: HubSpotDeal[];
    try {
      deals = await this.hubspot.listDeals({ properties: DEAL_PROPERTIES });
    } catch (err) {
      console.error(
        "[LiveSource] getInvoices: HubSpot listDeals failed; returning no invoices.",
        err,
      );
      return [];
    }

    return deals.flatMap((deal) => dealToInvoices(deal, { now: this.now }));
  }

  async getProject(id: string): Promise<ProjectDetail | null> {
    let deal: HubSpotDeal;
    try {
      deal = await this.hubspot.getDeal(id, DEAL_PROPERTIES);
    } catch (err) {
      console.error(
        `[LiveSource] getProject(${id}): HubSpot getDeal failed; returning null.`,
        err,
      );
      return null;
    }

    const twProject = await this.fetchTeamworkProject(deal);
    const stageInput = stageInputFromTeamwork(twProject);
    try {
      return projectDetailFrom(deal, twProject, stageInput, {
        now: this.now,
        teamworkDomain: env.teamworkDomain(),
      });
    } catch (err) {
      console.error(
        `[LiveSource] getProject(${id}): mapping failed; returning null.`,
        err,
      );
      return null;
    }
  }
}
