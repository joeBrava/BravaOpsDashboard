import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LiveSource } from "./live-source";
import type { HubSpotClient, HubSpotDeal } from "../clients/hubspot";
import type { TeamworkClient, TeamworkProject } from "../clients/teamwork";

/**
 * These tests drive `LiveSource` with **mocked client objects** (no global
 * fetch, no network). They assert two things the design spec requires:
 *   1. `getProjects()`/`getInvoices()`/`getProject()` map client output through
 *      the B3 mappers correctly.
 *   2. A client error degrades gracefully — `LiveSource` logs and returns an
 *      empty/partial result, NEVER throwing up to a page.
 *
 * The clients are plain objects implementing the read-only client interfaces,
 * so there is nothing to network-mock; every method is a `vi.fn()` we control.
 */

/** Fixed "today" so any relative due-date wording is deterministic. */
const NOW = new Date("2026-06-05T12:00:00.000Z");

function dealFixture(
  overrides: Partial<Record<string, string | null>> = {},
  id = "9001",
): HubSpotDeal {
  return {
    id,
    properties: {
      dealname: "Salt Lake Temple",
      dealstage: "contractsent",
      amount: "8500",
      hubspot_owner_id: "41000001",
      closedate: "2026-06-30T00:00:00.000Z",
      qbo_invoice_id: "1042",
      teamwork_project_id: "555",
      ...overrides,
    },
  };
}

/**
 * A Teamwork v3 project carrying tasklists + milestones in the shape the
 * stage-input extractor reads. Both arrays use `{ name, completed|status }`
 * the way the v3 API surfaces them.
 */
function twProjectFixture(
  overrides: Partial<Record<string, unknown>> = {},
): TeamworkProject {
  return {
    id: 555,
    name: "Salt Lake Temple — Production",
    tasklists: [
      { name: "Brick Selection", completed: true },
      { name: "Production Form", completed: true },
      { name: "Build", completed: false },
    ],
    ...overrides,
  };
}

/** Build a fully-mocked HubSpot client with sensible defaults per test. */
function mockHubSpot(over: Partial<HubSpotClient> = {}): HubSpotClient {
  return {
    getDeal: vi.fn(),
    listDeals: vi.fn().mockResolvedValue([]),
    getAssociatedCompanyId: vi.fn().mockResolvedValue(undefined),
    getAssociatedContactId: vi.fn().mockResolvedValue(undefined),
    getCompany: vi.fn(),
    getContact: vi.fn(),
    ...over,
  };
}

/** Build a fully-mocked Teamwork client with sensible defaults per test. */
function mockTeamwork(over: Partial<TeamworkClient> = {}): TeamworkClient {
  return {
    getProject: vi.fn(),
    listProjects: vi.fn().mockResolvedValue([]),
    projectUrl: vi.fn(
      (id) => `https://bravabrands.teamwork.com/app/projects/${id}`,
    ),
    ...over,
  };
}

describe("LiveSource", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- getInvoices ----------------------------------------------------------

  describe("getInvoices", () => {
    it("maps every deal's milestones through dealToInvoices", async () => {
      const hubspot = mockHubSpot({
        listDeals: vi.fn().mockResolvedValue([
          dealFixture({ dealname: "Salt Lake Temple", amount: "8500" }, "9001"),
          dealFixture({ dealname: "Acme Corp Q3", amount: "5000" }, "9002"),
        ]),
      });
      const source = new LiveSource({
        hubspot,
        teamwork: mockTeamwork(),
        now: NOW,
      });

      const invoices = await source.getInvoices();

      // 2 deals × 3 milestones each.
      expect(invoices).toHaveLength(6);
      expect(invoices.filter((i) => i.dealName === "Salt Lake Temple")).toHaveLength(3);
      expect(invoices.filter((i) => i.dealName === "Acme Corp Q3")).toHaveLength(3);
      // 20/40/40 split of 8500 for the first deal.
      const slt = invoices.filter((i) => i.dealName === "Salt Lake Temple");
      expect(slt.map((i) => i.amount)).toEqual([1700, 3400, 3400]);
    });

    it("returns [] (never throws) when listDeals rejects", async () => {
      const hubspot = mockHubSpot({
        listDeals: vi.fn().mockRejectedValue(new Error("HubSpot 500")),
      });
      const source = new LiveSource({ hubspot, teamwork: mockTeamwork() });

      const invoices = await source.getInvoices();

      expect(invoices).toEqual([]);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  // --- getProjects ----------------------------------------------------------

  describe("getProjects", () => {
    it("maps deals + their Teamwork projects to Projects with stages", async () => {
      const hubspot = mockHubSpot({
        listDeals: vi.fn().mockResolvedValue([dealFixture({}, "9001")]),
      });
      const teamwork = mockTeamwork({
        getProject: vi.fn().mockResolvedValue(twProjectFixture()),
      });
      const source = new LiveSource({ hubspot, teamwork, now: NOW });

      const projects = await source.getProjects();

      expect(projects).toHaveLength(1);
      const p = projects[0];
      expect(p.id).toBe("9001");
      expect(p.name).toBe("Salt Lake Temple");
      expect(p.owner).toBe("Joe Zautner");
      // stages derived from the Teamwork tasklists via the stage map.
      expect(p.stages.map((s) => `${s.key}:${s.state}`)).toEqual([
        "brick:done",
        "form:done",
        "build:current",
        "qa:upcoming",
        "ship:upcoming",
      ]);
    });

    it("resolves the Teamwork project from teamwork_project_id", async () => {
      const getProject = vi.fn().mockResolvedValue(twProjectFixture());
      const hubspot = mockHubSpot({
        listDeals: vi
          .fn()
          .mockResolvedValue([dealFixture({ teamwork_project_id: "555" }, "9001")]),
      });
      const source = new LiveSource({
        hubspot,
        teamwork: mockTeamwork({ getProject }),
        now: NOW,
      });

      await source.getProjects();

      expect(getProject).toHaveBeenCalledWith("555");
    });

    it("maps a deal with no Teamwork link (empty stage input) without fetching", async () => {
      const getProject = vi.fn();
      const hubspot = mockHubSpot({
        listDeals: vi
          .fn()
          .mockResolvedValue([dealFixture({ teamwork_project_id: null }, "9001")]),
      });
      const source = new LiveSource({
        hubspot,
        teamwork: mockTeamwork({ getProject }),
        now: NOW,
      });

      const projects = await source.getProjects();

      expect(getProject).not.toHaveBeenCalled();
      expect(projects).toHaveLength(1);
      // No stage items → brick current, the rest upcoming.
      expect(projects[0].stages.map((s) => s.state)).toEqual([
        "current",
        "upcoming",
        "upcoming",
        "upcoming",
        "upcoming",
      ]);
    });

    it("returns [] (never throws) when listDeals rejects", async () => {
      const hubspot = mockHubSpot({
        listDeals: vi.fn().mockRejectedValue(new Error("HubSpot down")),
      });
      const source = new LiveSource({ hubspot, teamwork: mockTeamwork() });

      const projects = await source.getProjects();

      expect(projects).toEqual([]);
      expect(errorSpy).toHaveBeenCalled();
    });

    it("degrades partially: a Teamwork failure on one deal keeps the rest", async () => {
      const hubspot = mockHubSpot({
        listDeals: vi.fn().mockResolvedValue([
          dealFixture({ dealname: "Good Deal" }, "9001"),
          dealFixture({ dealname: "Bad Teamwork", teamwork_project_id: "777" }, "9002"),
        ]),
      });
      const teamwork = mockTeamwork({
        getProject: vi.fn((id: string) => {
          if (id === "777") return Promise.reject(new Error("Teamwork 404"));
          return Promise.resolve(twProjectFixture());
        }),
      });
      const source = new LiveSource({ hubspot, teamwork, now: NOW });

      const projects = await source.getProjects();

      // Both deals still produce a Project; the failing Teamwork fetch just
      // yields empty stage input (no crash).
      expect(projects.map((p) => p.name).sort()).toEqual([
        "Bad Teamwork",
        "Good Deal",
      ]);
      const bad = projects.find((p) => p.name === "Bad Teamwork")!;
      expect(bad.stages).toHaveLength(5);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  // --- getProject -----------------------------------------------------------

  describe("getProject", () => {
    it("maps a single deal + Teamwork project to a ProjectDetail", async () => {
      const hubspot = mockHubSpot({
        getDeal: vi.fn().mockResolvedValue(dealFixture({}, "9001")),
      });
      const teamwork = mockTeamwork({
        getProject: vi.fn().mockResolvedValue(twProjectFixture({ id: 555 })),
      });
      const source = new LiveSource({ hubspot, teamwork, now: NOW });

      const detail = await source.getProject("9001");

      expect(detail).not.toBeNull();
      expect(detail!.id).toBe("9001");
      expect(detail!.name).toBe("Salt Lake Temple");
      expect(detail!.invoices.map((i) => i.lineItem)).toEqual([
        "Design deposit",
        "P1 milestone",
        "P2 milestone",
      ]);
      expect(detail!.hubspotUrl).toBe(
        "https://app.hubspot.com/contacts/0/deal/9001",
      );
      expect(detail!.teamworkUrl).toBe(
        "https://bravabrands.teamwork.com/app/projects/555",
      );
    });

    it("returns null (never throws) when the deal fetch rejects", async () => {
      const hubspot = mockHubSpot({
        getDeal: vi.fn().mockRejectedValue(new Error("deal 404")),
      });
      const source = new LiveSource({ hubspot, teamwork: mockTeamwork() });

      const detail = await source.getProject("nope");

      expect(detail).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });

    it("still returns a detail (no Teamwork link) when the Teamwork fetch fails", async () => {
      const hubspot = mockHubSpot({
        getDeal: vi.fn().mockResolvedValue(dealFixture({}, "9001")),
      });
      const teamwork = mockTeamwork({
        getProject: vi.fn().mockRejectedValue(new Error("Teamwork 500")),
      });
      const source = new LiveSource({ hubspot, teamwork, now: NOW });

      const detail = await source.getProject("9001");

      expect(detail).not.toBeNull();
      expect(detail!.id).toBe("9001");
      // Teamwork unavailable → link omitted, stages fall back to empty input.
      expect(detail!.teamworkUrl).toBeUndefined();
      expect(detail!.stages).toHaveLength(5);
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
