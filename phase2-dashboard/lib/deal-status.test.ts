import { describe, it, expect } from "vitest";
import { deriveStatus, getStatusMeta } from "./deal-status";
import type { Milestone } from "./types";

const ms = (
  design: Milestone["state"],
  p1: Milestone["state"],
  p2: Milestone["state"],
): Milestone[] => [
  { key: "design", state: design },
  { key: "p1", state: p1 },
  { key: "p2", state: p2 },
];

describe("deriveStatus", () => {
  it("is blocked when the design deposit is unpaid", () => {
    expect(deriveStatus(ms("unpaid", "na", "na"), false)).toBe("blocked");
  });

  it("is awaiting when design is paid but P1 is unpaid/pending", () => {
    expect(deriveStatus(ms("paid", "unpaid", "na"), false)).toBe("awaiting");
    expect(deriveStatus(ms("paid", "pending", "na"), false)).toBe("awaiting");
  });

  it("is in_production when design + P1 are paid and flagged in production", () => {
    expect(deriveStatus(ms("paid", "paid", "pending"), true)).toBe("in_production");
  });

  it("is ready when design + P1 paid but not yet in production", () => {
    expect(deriveStatus(ms("paid", "paid", "na"), false)).toBe("ready");
  });
});

describe("getStatusMeta", () => {
  it("maps each status to a label and non-empty classes", () => {
    for (const key of ["in_production", "ready", "awaiting", "blocked"] as const) {
      const meta = getStatusMeta(key);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.edgeClass.length).toBeGreaterThan(0);
      expect(meta.pillClass.length).toBeGreaterThan(0);
      expect(meta.dotClass.length).toBeGreaterThan(0);
    }
  });

  it("uses the danger edge for blocked and lime edge for in_production", () => {
    expect(getStatusMeta("blocked").edgeClass).toContain("border-l-danger");
    expect(getStatusMeta("in_production").edgeClass).toContain("border-l-lime");
  });
});
