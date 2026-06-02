import { describe, it, expect } from "vitest";
import {
  getProjectStatusMeta,
  STAGE_ORDER,
  STAGE_LABELS,
  stageStateIcon,
} from "./project-status";
import type { ProjectStatusKey } from "./types";

describe("getProjectStatusMeta", () => {
  it("maps each status to a label and non-empty classes", () => {
    for (const key of [
      "on_track",
      "at_risk",
      "blocked",
      "shipping",
    ] as ProjectStatusKey[]) {
      const meta = getProjectStatusMeta(key);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.edgeClass.length).toBeGreaterThan(0);
      expect(meta.pillClass.length).toBeGreaterThan(0);
      expect(meta.dotClass.length).toBeGreaterThan(0);
    }
  });

  it("uses the danger edge for blocked and teal edge for shipping", () => {
    expect(getProjectStatusMeta("blocked").edgeClass).toContain("border-l-danger");
    expect(getProjectStatusMeta("shipping").edgeClass).toContain("border-l-teal");
  });
});

describe("stages", () => {
  it("STAGE_ORDER lists all five stages in build order", () => {
    expect(STAGE_ORDER).toEqual(["brick", "form", "build", "qa", "ship"]);
  });

  it("STAGE_LABELS has a non-empty label for every ordered stage", () => {
    for (const key of STAGE_ORDER) {
      expect(STAGE_LABELS[key].length).toBeGreaterThan(0);
    }
  });

  it("stageStateIcon maps each state to a distinct non-empty glyph", () => {
    const done = stageStateIcon("done");
    const current = stageStateIcon("current");
    const upcoming = stageStateIcon("upcoming");
    expect(done.length).toBeGreaterThan(0);
    expect(current.length).toBeGreaterThan(0);
    expect(upcoming.length).toBeGreaterThan(0);
    expect(new Set([done, current, upcoming]).size).toBe(3);
  });
});
