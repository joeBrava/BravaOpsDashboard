import {
  STAGE_LABELS,
  STAGE_ORDER,
  stageStateClass,
  stageStateIcon,
} from "@/lib/project-status";
import type { ProductionStage } from "@/lib/types";

/** Return the project's stages in canonical order, defaulting any missing stage to "upcoming". */
function ordered(stages: ProductionStage[]): ProductionStage[] {
  return STAGE_ORDER.map(
    (key) =>
      stages.find((s) => s.key === key) ?? { key, state: "upcoming" as const },
  );
}

export function StageChips({ stages }: { stages: ProductionStage[] }) {
  return (
    <>
      {ordered(stages).map((s) => (
        <span
          key={s.key}
          className={`inline-flex items-center gap-[6px] text-[0.78rem] font-medium ${
            s.state === "upcoming" ? "text-gray-mid" : "text-gray-dark"
          }`}
        >
          <span
            className={`h-[7px] w-[7px] rounded-full ${stageStateClass(s.state)}`}
          />
          {STAGE_LABELS[s.key]} {stageStateIcon(s.state)}
        </span>
      ))}
    </>
  );
}
