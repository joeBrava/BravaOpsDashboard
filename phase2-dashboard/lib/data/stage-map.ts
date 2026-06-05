import type { ProductionStage, ProductionStageKey } from "../types";
import { STAGE_ORDER } from "../project-status";

/**
 * Teamwork → 5 production-stage mapping (one of the two "known unknowns" from
 * the design spec, isolated here so wrong guesses are a single-file change).
 *
 * Teamwork has no clean "what production stage is this project in?" signal — the
 * existing automations only flip a project category (Active → In Production).
 * So we approximate it from the project's **tasklist + milestone names** plus
 * their completion. Each of the 5 canonical stages
 * (`brick → form → build → qa → ship`) owns a small set of name fragments; an
 * incoming item is attributed to a stage when its (trimmed, lower-cased) name
 * **contains** one of that stage's fragments.
 *
 * Defaults below are best-effort, derived from Brava's production vocabulary
 * (brick selection, production form, build, QA/approval, ship/delivery). When
 * live data shows different real-world names, edit `STAGE_CONFIG` — nothing else
 * needs to change.
 *
 * Matching rules (documented so callers can reason about edge cases):
 *  - Case-insensitive, whitespace-trimmed, **substring** match (so prefixed
 *    titles like "Phase 2 — Build tasks" still attribute to `build`).
 *  - An **unknown** name (matching no stage's fragments) is ignored — it cannot
 *    mark any stage done. A stage with zero matching items is treated as not
 *    started.
 *  - A stage is `done` only when it has **at least one** matching item AND
 *    **every** matching item is complete. Any incomplete match keeps it not-done.
 *
 * State derivation (linear pipeline, canonical order):
 *  - Walk the 5 stages in `STAGE_ORDER`.
 *  - Every stage up to (but not including) the first not-done stage is `done`.
 *  - The first not-done stage is `current`.
 *  - Everything after it is `upcoming`.
 *  - All complete → all `done`. None complete → `brick` current, rest upcoming.
 *  This keeps the "current" boundary at the earliest unfinished stage even if a
 *  later stage happens to be complete (out-of-order completion still yields a
 *  sensible single in-flight stage).
 */

/** Per-stage matching config. `names[0]` is the canonical/display name. */
export interface StageConfig {
  /** Lowercased name fragments that attribute an item to this stage. */
  names: string[];
}

export const STAGE_CONFIG: Record<ProductionStageKey, StageConfig> = {
  brick: { names: ["brick selection", "brick", "design"] },
  form: { names: ["production form", "form", "spec"] },
  build: { names: ["build", "production", "manufactur"] },
  qa: { names: ["qa", "approval", "quality", "review"] },
  ship: { names: ["ship", "delivery", "deliver", "fulfil"] },
};

/** A Teamwork tasklist or milestone reduced to what the stage map needs. */
export interface StageInputItem {
  /** tasklist or milestone name */
  name: string;
  /** whether the tasklist/milestone is complete */
  completed: boolean;
}

export interface StageMapInput {
  items: StageInputItem[];
}

/** Returns the stage key an item name attributes to, or null if unknown. */
function matchStage(name: string): ProductionStageKey | null {
  const haystack = name.trim().toLowerCase();
  if (!haystack) return null;
  for (const key of STAGE_ORDER) {
    if (STAGE_CONFIG[key].names.some((frag) => haystack.includes(frag))) {
      return key;
    }
  }
  return null;
}

/**
 * Map Teamwork tasklist/milestone names + completion onto the 5 ordered
 * production stages with `done`/`current`/`upcoming` state. See the file-level
 * doc for the full matching + state rules. Unknown names default to upcoming
 * (they never mark a stage done).
 */
export function mapTeamworkToStages(input: StageMapInput): ProductionStage[] {
  // Per stage: does it have any matching item, and are all matches complete?
  const seen: Record<ProductionStageKey, boolean> = {
    brick: false,
    form: false,
    build: false,
    qa: false,
    ship: false,
  };
  const allComplete: Record<ProductionStageKey, boolean> = {
    brick: true,
    form: true,
    build: true,
    qa: true,
    ship: true,
  };

  for (const item of input.items) {
    const key = matchStage(item.name);
    if (!key) continue; // unknown name → ignored
    seen[key] = true;
    if (!item.completed) allComplete[key] = false;
  }

  /** A stage is done iff it has at least one matching item, all complete. */
  const isDone = (key: ProductionStageKey): boolean =>
    seen[key] && allComplete[key];

  // First stage that is not done becomes `current`; everything before is done,
  // everything after is upcoming. If all are done, there is no current.
  const firstNotDone = STAGE_ORDER.findIndex((key) => !isDone(key));

  return STAGE_ORDER.map((key, index) => {
    if (firstNotDone === -1 || index < firstNotDone) {
      return { key, state: "done" };
    }
    if (index === firstNotDone) {
      return { key, state: "current" };
    }
    return { key, state: "upcoming" };
  });
}
