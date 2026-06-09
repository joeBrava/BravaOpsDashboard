import { describe, it, expect } from "vitest";
import { dealHref, projectIdForDealName } from "./deal-link";
import type { Project } from "./types";

const stages: Project["stages"] = [
  { key: "brick", state: "done" },
  { key: "form", state: "current" },
  { key: "build", state: "upcoming" },
  { key: "qa", state: "upcoming" },
  { key: "ship", state: "upcoming" },
];

const projects: Project[] = [
  {
    id: "salt-lake-temple",
    name: "Salt Lake Temple",
    owner: "Joe Z.",
    ownerInitials: "JZ",
    status: "on_track",
    stages,
  },
  {
    id: "acme-corp-q3",
    name: "Acme Corp Q3",
    owner: "Miya A.",
    ownerInitials: "MA",
    status: "at_risk",
    stages,
  },
];

describe("dealHref", () => {
  it("builds the canonical detail path from a project id", () => {
    expect(dealHref("salt-lake-temple")).toBe("/deals/salt-lake-temple");
  });
});

describe("projectIdForDealName", () => {
  it("maps a deal name to the owning project's id", () => {
    expect(projectIdForDealName(projects, "Salt Lake Temple")).toBe(
      "salt-lake-temple",
    );
  });

  it("matches case-insensitively and trims whitespace", () => {
    expect(projectIdForDealName(projects, "  acme corp q3  ")).toBe(
      "acme-corp-q3",
    );
  });

  it("returns undefined for an unknown deal name", () => {
    expect(projectIdForDealName(projects, "Nonexistent Deal")).toBeUndefined();
  });

  it("returns undefined for empty or nullish input", () => {
    expect(projectIdForDealName(projects, "")).toBeUndefined();
    expect(projectIdForDealName(projects, null)).toBeUndefined();
    expect(projectIdForDealName(projects, undefined)).toBeUndefined();
  });
});
