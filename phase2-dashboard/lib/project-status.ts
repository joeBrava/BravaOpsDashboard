import type {
  ProductionStageKey,
  ProjectStatusKey,
  StageState,
} from "./types";

export interface StatusMeta {
  label: string;
  /** Tailwind class for the card's left edge color */
  edgeClass: string;
  /** Tailwind classes for the status pill (bg + text) */
  pillClass: string;
  /** Tailwind class for the pill's leading dot */
  dotClass: string;
}

const META: Record<ProjectStatusKey, StatusMeta> = {
  on_track: {
    label: "On track",
    edgeClass: "border-l-lime",
    pillClass: "bg-[#f1f5ce] text-[#5c6a00]",
    dotClass: "bg-lime",
  },
  at_risk: {
    label: "At risk",
    edgeClass: "border-l-gold",
    pillClass: "bg-[#fff1c9] text-[#876a00]",
    dotClass: "bg-gold",
  },
  blocked: {
    label: "Blocked",
    edgeClass: "border-l-danger",
    pillClass: "bg-[#ffe1e5] text-[#c20f2b]",
    dotClass: "bg-danger",
  },
  shipping: {
    label: "Shipping",
    edgeClass: "border-l-teal",
    pillClass: "bg-[#d7f4f2] text-[#00726e]",
    dotClass: "bg-teal",
  },
};

export function getProjectStatusMeta(key: ProjectStatusKey): StatusMeta {
  return META[key];
}

/** Canonical left-to-right render order of production stages. */
export const STAGE_ORDER: ProductionStageKey[] = [
  "brick",
  "form",
  "build",
  "qa",
  "ship",
];

export const STAGE_LABELS: Record<ProductionStageKey, string> = {
  brick: "Brick Selection",
  form: "Production Form",
  build: "Build",
  qa: "QA / Approval",
  ship: "Ship",
};

/** Tailwind dot color for a stage chip by state. */
export function stageStateClass(state: StageState): string {
  switch (state) {
    case "done":
      return "bg-lime";
    case "current":
      return "bg-purple";
    default:
      return "bg-gray-light";
  }
}

/** Leading glyph for a stage chip by state. */
export function stageStateIcon(state: StageState): string {
  switch (state) {
    case "done":
      return "✓";
    case "current":
      return "▷";
    default:
      return "·";
  }
}
