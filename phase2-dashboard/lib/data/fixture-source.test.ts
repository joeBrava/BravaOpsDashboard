import { describe, it, expect } from "vitest";
import { FixtureSource } from "./fixture-source";

describe("FixtureSource", () => {
  const source = new FixtureSource();

  it("getProjects() returns the 4 seed projects", async () => {
    const projects = await source.getProjects();
    expect(projects).toHaveLength(4);
    expect(projects.map((p) => p.id)).toEqual([
      "salt-lake-temple",
      "acme-corp-q3",
      "big-customer-logo",
      "riverside-plaza",
    ]);
  });

  it("getInvoices() returns the 6 seed invoices", async () => {
    const invoices = await source.getInvoices();
    expect(invoices).toHaveLength(6);
  });

  it("getProject() returns a ProjectDetail with its linked invoices", async () => {
    const detail = await source.getProject("salt-lake-temple");
    expect(detail).not.toBeNull();
    expect(detail!.id).toBe("salt-lake-temple");
    expect(detail!.name).toBe("Salt Lake Temple");
    // base Project fields survive
    expect(detail!.stages).toHaveLength(5);
    // Salt Lake Temple has 3 invoices in the fixtures (1039, 1038, 1031)
    expect(detail!.invoices).toHaveLength(3);
    expect(detail!.invoices.every((inv) => inv.dealName === "Salt Lake Temple")).toBe(true);
    expect(detail!.invoices.map((inv) => inv.id).sort()).toEqual(["1031", "1038", "1039"]);
  });

  it("getProject() returns ProjectDetail metadata for a known project", async () => {
    const detail = await source.getProject("salt-lake-temple");
    expect(detail!.hubspotUrl).toBeTruthy();
    expect(detail!.teamworkUrl).toBeTruthy();
  });

  it("getProject() returns null for an unknown id", async () => {
    expect(await source.getProject("nope")).toBeNull();
  });
});
