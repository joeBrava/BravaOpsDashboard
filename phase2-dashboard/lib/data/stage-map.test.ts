import { describe, it, expect } from "vitest";
import { mapTeamworkToStages, STAGE_CONFIG } from "./stage-map";
import { STAGE_ORDER } from "../project-status";
import type { ProductionStageKey } from "../types";

/**
 * Test input shape mirrors what `LiveSource` will derive from a Teamwork
 * project's tasklists + milestones (Task B4): a flat list of named items,
 * each marked complete or not. The canonical default names below come from
 * `STAGE_CONFIG` so the tests stay in lockstep with the documented map.
 */
function namedItem(name: string, completed: boolean) {
  return { name, completed };
}

/** Build one item per stage key using that stage's first canonical name. */
function itemsForStages(
  stages: Partial<Record<ProductionStageKey, boolean>>,
) {
  return (Object.entries(stages) as [ProductionStageKey, boolean][]).map(
    ([key, completed]) => namedItem(STAGE_CONFIG[key].names[0], completed),
  );
}

describe("mapTeamworkToStages", () => {
  it("returns the 5 stages in canonical order", () => {
    const stages = mapTeamworkToStages({ items: [] });
    expect(stages.map((s) => s.key)).toEqual(STAGE_ORDER);
    expect(stages).toHaveLength(5);
  });

  it("all stages complete -> all done", () => {
    const items = itemsForStages({
      brick: true,
      form: true,
      build: true,
      qa: true,
      ship: true,
    });
    const stages = mapTeamworkToStages({ items });
    expect(stages.every((s) => s.state === "done")).toBe(true);
  });

  it("no items -> brick current, rest upcoming", () => {
    const stages = mapTeamworkToStages({ items: [] });
    expect(stages.map((s) => s.state)).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("mid-progress -> current sits at the first incomplete stage", () => {
    // brick + form complete, build present-but-incomplete, qa/ship absent
    const items = itemsForStages({
      brick: true,
      form: true,
      build: false,
    });
    const stages = mapTeamworkToStages({ items });
    expect(stages.map((s) => s.state)).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });

  it("the current boundary is the first stage that is not done", () => {
    // brick done, form not done (even though build is done): boundary is form
    const items = itemsForStages({
      brick: true,
      form: false,
      build: true,
    });
    const stages = mapTeamworkToStages({ items });
    expect(stages.map((s) => s.state)).toEqual([
      "done",
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("unknown item names default to upcoming (no stage is marked done)", () => {
    const items = [
      namedItem("Random other tasklist", true),
      namedItem("Untitled milestone", true),
    ];
    const stages = mapTeamworkToStages({ items });
    // No recognized stage -> brick is the first not-done stage -> current.
    expect(stages.map((s) => s.state)).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("matches stage names case-insensitively and trims whitespace", () => {
    const brickName = STAGE_CONFIG.brick.names[0];
    const items = [namedItem(`  ${brickName.toUpperCase()}  `, true)];
    const stages = mapTeamworkToStages({ items });
    expect(stages[0]).toEqual({ key: "brick", state: "done" });
  });

  it("matches stage names by substring (e.g. prefixed tasklist titles)", () => {
    const buildName = STAGE_CONFIG.build.names[0];
    const items = [
      namedItem("Brick Selection", true),
      namedItem("Production Form", true),
      namedItem(`Phase 2 — ${buildName} tasks`, true),
    ];
    const stages = mapTeamworkToStages({ items });
    expect(stages.map((s) => s.state)).toEqual([
      "done",
      "done",
      "done",
      "current",
      "upcoming",
    ]);
  });

  it("a stage is done only when every matching item is complete", () => {
    const brickName = STAGE_CONFIG.brick.names[0];
    const items = [
      namedItem(brickName, true),
      namedItem(`${brickName} follow-up`, false),
    ];
    const stages = mapTeamworkToStages({ items });
    // brick has an incomplete matching item -> not done -> current.
    expect(stages[0]).toEqual({ key: "brick", state: "current" });
  });

  it("STAGE_CONFIG covers every canonical stage key with at least one name", () => {
    for (const key of STAGE_ORDER) {
      expect(STAGE_CONFIG[key].names.length).toBeGreaterThan(0);
    }
  });
});
