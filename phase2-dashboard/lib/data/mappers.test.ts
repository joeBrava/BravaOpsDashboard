import { describe, it, expect } from "vitest";
import {
  dealToInvoices,
  projectFrom,
  projectDetailFrom,
  OWNER_DIRECTORY,
} from "./mappers";
import type { HubSpotDeal } from "../clients/hubspot";
import type { TeamworkProject } from "../clients/teamwork";

/**
 * These tests feed **captured-shape** HubSpot deal + Teamwork project fixtures
 * (the exact return types of the read-only clients ported in Task B1) and
 * assert the EXACT mapped output. They exercise pure functions only — no
 * network, no clients — so there is nothing to mock.
 *
 * Every assumption the mappers encode is documented inline in `mappers.ts`;
 * the cases below pin the observable consequences of those assumptions.
 *
 * Relative due-date wording ("N days overdue" / "due in N days") is computed
 * against `NOW`, a fixed reference clock injected into the mappers so the tests
 * are deterministic regardless of the real wall clock.
 */

/** Fixed "today" for deterministic relative-date assertions: 2026-06-05. */
const NOW = new Date("2026-06-05T12:00:00.000Z");

// --- Captured-shape fixtures -------------------------------------------------

/**
 * A HubSpot deal as `createHubSpotClient().getDeal(id, [...props])` returns it:
 * `{ id, properties: Record<string, string | null> }`. Property keys are the
 * HubSpot internal names the dashboard requests. Values are always strings or
 * null (HubSpot hydrates every property as a string).
 */
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
      ...overrides,
    },
  };
}

/**
 * A Teamwork v3 project as `createTeamworkClient().getProject(id)` returns it
 * (the `data.project` envelope already unwrapped). Permissive record; the
 * mapper only reads `id` and `name`, and derives stages from the separately
 * supplied tasklist/milestone items.
 */
function twProjectFixture(
  overrides: Partial<Record<string, unknown>> = {},
): TeamworkProject {
  return {
    id: 555,
    name: "Salt Lake Temple — Production",
    ...overrides,
  };
}

// --- dealToInvoices ----------------------------------------------------------

describe("dealToInvoices", () => {
  it("derives the three milestone invoices (design, P1, P2) from amount", () => {
    const invoices = dealToInvoices(dealFixture());
    expect(invoices).toHaveLength(3);
    expect(invoices.map((i) => i.lineItem)).toEqual([
      "Design deposit",
      "P1 milestone",
      "P2 milestone",
    ]);
  });

  it("splits the deal amount 20/40/40 across design/P1/P2 (documented assumption)", () => {
    // amount = 8500 → design 20% = 1700, P1 40% = 3400, P2 40% = 3400.
    const invoices = dealToInvoices(dealFixture({ amount: "8500" }));
    expect(invoices.map((i) => i.amount)).toEqual([1700, 3400, 3400]);
    // Splits always re-sum to the deal total (no rounding drift).
    expect(invoices.reduce((s, i) => s + i.amount, 0)).toBe(8500);
  });

  it("absorbs rounding remainder into the final (P2) milestone", () => {
    // amount = 8501 → design round(1700.2)=1700, P1 round(3400.4)=3400,
    // P2 = remainder 8501-1700-3400 = 3401 (so the split is exact).
    const invoices = dealToInvoices(dealFixture({ amount: "8501" }));
    expect(invoices.map((i) => i.amount)).toEqual([1700, 3400, 3401]);
    expect(invoices.reduce((s, i) => s + i.amount, 0)).toBe(8501);
  });

  it("ids each milestone off the deal id + line suffix when no qbo_invoice_id", () => {
    const invoices = dealToInvoices(
      dealFixture({ qbo_invoice_id: null }, "9001"),
    );
    expect(invoices.map((i) => i.id)).toEqual([
      "9001-design",
      "9001-p1",
      "9001-p2",
    ]);
  });

  it("uses qbo_invoice_id as the design-deposit invoice id when present", () => {
    // The single QBO invoice id on the deal is the *first* billed milestone
    // (the design deposit); later milestones keep the synthetic suffix id.
    const invoices = dealToInvoices(
      dealFixture({ qbo_invoice_id: "1042" }, "9001"),
    );
    expect(invoices.map((i) => i.id)).toEqual(["1042", "9001-p1", "9001-p2"]);
  });

  it("dealstage 'appointmentscheduled' → all three unpaid (nothing billed yet)", () => {
    const invoices = dealToInvoices(
      dealFixture({ dealstage: "appointmentscheduled" }),
    );
    expect(invoices.map((i) => i.status)).toEqual([
      "unpaid",
      "unpaid",
      "unpaid",
    ]);
  });

  it("dealstage 'contractsent' → design paid, P1 pending, P2 unpaid", () => {
    // Assumption: a signed contract means the design deposit has cleared, the
    // P1 milestone is invoiced/awaiting payment, and P2 is not yet billed.
    const invoices = dealToInvoices(
      dealFixture({ dealstage: "contractsent" }),
    );
    expect(invoices.map((i) => i.status)).toEqual([
      "paid",
      "pending",
      "unpaid",
    ]);
  });

  it("dealstage 'closedwon' → all three paid", () => {
    const invoices = dealToInvoices(dealFixture({ dealstage: "closedwon" }));
    expect(invoices.map((i) => i.status)).toEqual(["paid", "paid", "paid"]);
  });

  it("dealstage 'closedlost' → all three unpaid (deal dead, nothing collected)", () => {
    const invoices = dealToInvoices(dealFixture({ dealstage: "closedlost" }));
    expect(invoices.map((i) => i.status)).toEqual([
      "unpaid",
      "unpaid",
      "unpaid",
    ]);
  });

  it("unknown dealstage falls back to all unpaid (conservative default)", () => {
    const invoices = dealToInvoices(
      dealFixture({ dealstage: "some_custom_pipeline_stage" }),
    );
    expect(invoices.map((i) => i.status)).toEqual([
      "unpaid",
      "unpaid",
      "unpaid",
    ]);
  });

  it("flags an unpaid invoice past its due date as overdue", () => {
    // closedate in the past + still unpaid → overdue, with a relative dueNote.
    const invoices = dealToInvoices(
      dealFixture({
        dealstage: "appointmentscheduled",
        closedate: "2026-06-01T00:00:00.000Z",
      }),
      { now: NOW },
    );
    const design = invoices[0];
    expect(design.status).toBe("unpaid");
    expect(design.overdue).toBe(true);
    // 2026-06-05 (today) − 2026-06-01 = 4 days overdue.
    expect(design.dueNote).toBe("4 days overdue");
  });

  it("a future due date on an unpaid invoice reads 'due in N days', not overdue", () => {
    const invoices = dealToInvoices(
      dealFixture({
        dealstage: "appointmentscheduled",
        closedate: "2026-06-10T00:00:00.000Z",
      }),
      { now: NOW },
    );
    const design = invoices[0];
    expect(design.overdue).toBeUndefined();
    expect(design.dueNote).toBe("due in 5 days");
  });

  it("a paid invoice is never overdue and carries a 'paid' dueNote", () => {
    const invoices = dealToInvoices(
      dealFixture({
        dealstage: "closedwon",
        closedate: "2026-06-01T00:00:00.000Z",
      }),
      { now: NOW },
    );
    expect(invoices.every((i) => i.overdue === undefined)).toBe(true);
    expect(invoices.every((i) => i.dueNote === "Paid")).toBe(true);
  });

  it("a pending invoice reads 'Invoiced' regardless of due date", () => {
    const invoices = dealToInvoices(
      dealFixture({
        dealstage: "contractsent",
        closedate: "2026-06-01T00:00:00.000Z",
      }),
      { now: NOW },
    );
    expect(invoices[1].status).toBe("pending");
    expect(invoices[1].dueNote).toBe("Invoiced");
    expect(invoices[1].overdue).toBeUndefined();
  });

  it("a missing/zero amount yields zero-amount milestones, never NaN", () => {
    const invoices = dealToInvoices(dealFixture({ amount: null }));
    expect(invoices.map((i) => i.amount)).toEqual([0, 0, 0]);
  });

  it("every invoice carries the deal name", () => {
    const invoices = dealToInvoices(
      dealFixture({ dealname: "Acme Corp Q3" }),
    );
    expect(invoices.every((i) => i.dealName === "Acme Corp Q3")).toBe(true);
  });

  it("a missing dealname falls back to 'Untitled deal'", () => {
    const invoices = dealToInvoices(dealFixture({ dealname: null }));
    expect(invoices[0].dealName).toBe("Untitled deal");
  });

  it("maps the full captured fixture to the exact expected invoice array", () => {
    const invoices = dealToInvoices(
      dealFixture(
        {
          dealname: "Salt Lake Temple",
          dealstage: "contractsent",
          amount: "8500",
          closedate: "2026-06-10T00:00:00.000Z",
          qbo_invoice_id: "1042",
        },
        "9001",
      ),
      { now: NOW },
    );
    expect(invoices).toEqual([
      {
        id: "1042",
        dealName: "Salt Lake Temple",
        lineItem: "Design deposit",
        amount: 1700,
        status: "paid",
        dueNote: "Paid",
      },
      {
        id: "9001-p1",
        dealName: "Salt Lake Temple",
        lineItem: "P1 milestone",
        amount: 3400,
        status: "pending",
        dueNote: "Invoiced",
      },
      {
        id: "9001-p2",
        dealName: "Salt Lake Temple",
        lineItem: "P2 milestone",
        amount: 3400,
        status: "unpaid",
        dueNote: "due in 5 days",
      },
    ]);
  });
});

// --- projectFrom -------------------------------------------------------------

describe("projectFrom", () => {
  function stageItems() {
    return {
      items: [
        { name: "Brick Selection", completed: true },
        { name: "Production Form", completed: true },
        { name: "Build", completed: false },
      ],
    };
  }

  it("uses the HubSpot deal name as the project name (source of truth)", () => {
    const project = projectFrom(
      dealFixture({ dealname: "Acme Corp Q3" }),
      twProjectFixture(),
      stageItems(),
    );
    expect(project.name).toBe("Acme Corp Q3");
  });

  it("derives the project id from the deal id", () => {
    const project = projectFrom(
      dealFixture({}, "9001"),
      twProjectFixture(),
      stageItems(),
    );
    expect(project.id).toBe("9001");
  });

  it("resolves owner + initials from hubspot_owner_id via the directory", () => {
    const project = projectFrom(
      dealFixture({ hubspot_owner_id: "41000001" }),
      twProjectFixture(),
      stageItems(),
    );
    expect(project.owner).toBe("Joe Zautner");
    expect(project.ownerInitials).toBe("JZ");
  });

  it("falls back to 'Unassigned' / '—' for an unknown owner id", () => {
    const project = projectFrom(
      dealFixture({ hubspot_owner_id: "99999999" }),
      twProjectFixture(),
      stageItems(),
    );
    expect(project.owner).toBe("Unassigned");
    expect(project.ownerInitials).toBe("—");
  });

  it("falls back to 'Unassigned' / '—' for a null owner id", () => {
    const project = projectFrom(
      dealFixture({ hubspot_owner_id: null }),
      twProjectFixture(),
      stageItems(),
    );
    expect(project.owner).toBe("Unassigned");
    expect(project.ownerInitials).toBe("—");
  });

  it("derives stages from the supplied items via mapTeamworkToStages", () => {
    const project = projectFrom(
      dealFixture(),
      twProjectFixture(),
      stageItems(),
    );
    expect(project.stages.map((s) => `${s.key}:${s.state}`)).toEqual([
      "brick:done",
      "form:done",
      "build:current",
      "qa:upcoming",
      "ship:upcoming",
    ]);
  });

  it("status heuristic: a project on the ship stage is 'shipping'", () => {
    const project = projectFrom(dealFixture(), twProjectFixture(), {
      items: [
        { name: "Brick Selection", completed: true },
        { name: "Production Form", completed: true },
        { name: "Build", completed: true },
        { name: "QA", completed: true },
        { name: "Ship", completed: false },
      ],
    });
    expect(project.status).toBe("shipping");
  });

  it("status heuristic: an overdue unpaid milestone makes the project 'at_risk'", () => {
    // closedate in the past + appointmentscheduled (all unpaid & overdue).
    const project = projectFrom(
      dealFixture({
        dealstage: "appointmentscheduled",
        closedate: "2026-06-01T00:00:00.000Z",
      }),
      twProjectFixture(),
      stageItems(),
      { now: NOW },
    );
    expect(project.status).toBe("at_risk");
  });

  it("status heuristic: a flagged blocker makes the project 'blocked'", () => {
    const project = projectFrom(
      dealFixture(),
      twProjectFixture(),
      stageItems(),
      { blocker: "QA flagged a color mismatch" },
    );
    expect(project.status).toBe("blocked");
    expect(project.blocker).toBe("⚠️ QA flagged a color mismatch");
  });

  it("status heuristic: otherwise 'on_track'", () => {
    const project = projectFrom(
      dealFixture({
        dealstage: "contractsent",
        closedate: "2026-06-30T00:00:00.000Z",
      }),
      twProjectFixture(),
      stageItems(),
      { now: NOW },
    );
    expect(project.status).toBe("on_track");
  });

  it("carries note + nextStep when supplied, and a default nextStep otherwise", () => {
    const withNotes = projectFrom(
      dealFixture(),
      twProjectFixture(),
      stageItems(),
      { note: "Build underway" },
    );
    expect(withNotes.note).toBe("Build underway");
    // nextStep defaults to the current stage's label.
    expect(withNotes.nextStep).toBe("next: Build");
  });

  it("blocker is undefined (not present) when no blocker is supplied", () => {
    const project = projectFrom(
      dealFixture(),
      twProjectFixture(),
      stageItems(),
    );
    expect(project.blocker).toBeUndefined();
  });

  it("maps the full captured fixture to the exact expected Project", () => {
    const project = projectFrom(
      dealFixture(
        {
          dealname: "Salt Lake Temple",
          dealstage: "contractsent",
          amount: "8500",
          hubspot_owner_id: "41000001",
          closedate: "2026-06-30T00:00:00.000Z",
        },
        "9001",
      ),
      twProjectFixture(),
      stageItems(),
      { note: "Build underway", now: NOW },
    );
    expect(project).toEqual({
      id: "9001",
      name: "Salt Lake Temple",
      owner: "Joe Zautner",
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
      nextStep: "next: Build",
    });
  });
});

// --- projectDetailFrom -------------------------------------------------------

describe("projectDetailFrom", () => {
  function stageItems() {
    return {
      items: [
        { name: "Brick Selection", completed: true },
        { name: "Production Form", completed: true },
        { name: "Build", completed: false },
      ],
    };
  }

  it("extends the Project with invoices, deep-links and company metadata", () => {
    const deal = dealFixture(
      {
        dealname: "Salt Lake Temple",
        dealstage: "contractsent",
        amount: "8500",
        hubspot_owner_id: "41000001",
        closedate: "2026-06-30T00:00:00.000Z",
        qbo_invoice_id: "1042",
      },
      "9001",
    );
    const twProject = twProjectFixture({ id: 555 });

    const detail = projectDetailFrom(deal, twProject, stageItems(), {
      note: "Build underway",
      companyName: "Salt Lake Temple Inc.",
      teamworkDomain: "bravabrands.teamwork.com",
      now: NOW,
    });

    // Base Project fields are identical to projectFrom's output.
    expect(detail.id).toBe("9001");
    expect(detail.name).toBe("Salt Lake Temple");
    expect(detail.owner).toBe("Joe Zautner");
    expect(detail.status).toBe("on_track");

    // Invoices are dealToInvoices(deal).
    expect(detail.invoices.map((i) => i.lineItem)).toEqual([
      "Design deposit",
      "P1 milestone",
      "P2 milestone",
    ]);

    // Deep links + metadata.
    expect(detail.hubspotUrl).toBe(
      "https://app.hubspot.com/contacts/0/deal/9001",
    );
    expect(detail.teamworkUrl).toBe(
      "https://bravabrands.teamwork.com/app/projects/555",
    );
    expect(detail.companyName).toBe("Salt Lake Temple Inc.");
    expect(detail.dueDate).toBe("2026-06-30T00:00:00.000Z");
  });

  it("falls back to the deal name for companyName when none supplied", () => {
    const detail = projectDetailFrom(
      dealFixture({ dealname: "Acme Corp Q3" }),
      twProjectFixture(),
      stageItems(),
    );
    expect(detail.companyName).toBe("Acme Corp Q3");
  });

  it("uses the default Teamwork domain when none supplied", () => {
    const detail = projectDetailFrom(
      dealFixture(),
      twProjectFixture({ id: 555 }),
      stageItems(),
    );
    expect(detail.teamworkUrl).toBe(
      "https://bravabrands.teamwork.com/app/projects/555",
    );
  });

  it("omits the Teamwork link when there is no Teamwork project", () => {
    const detail = projectDetailFrom(dealFixture(), null, stageItems());
    expect(detail.teamworkUrl).toBeUndefined();
    // The HubSpot link still resolves off the deal id.
    expect(detail.hubspotUrl).toBe(
      "https://app.hubspot.com/contacts/0/deal/9001",
    );
    // Stages still derive from the supplied items (Teamwork project optional).
    expect(detail.stages.map((s) => s.state)).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });
});

// --- OWNER_DIRECTORY ---------------------------------------------------------

describe("OWNER_DIRECTORY", () => {
  it("maps every known owner id to a name + initials", () => {
    for (const [id, entry] of Object.entries(OWNER_DIRECTORY)) {
      expect(id).toMatch(/^\d+$/);
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.initials.length).toBeGreaterThan(0);
    }
  });
});
