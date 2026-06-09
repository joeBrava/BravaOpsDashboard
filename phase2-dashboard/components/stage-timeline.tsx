import {
  STAGE_LABELS,
  STAGE_ORDER,
  stageStateClass,
  stageStateIcon,
} from "@/lib/project-status";
import type { ProductionStage, StageState } from "@/lib/types";

/**
 * Vertical 5-stage production timeline for the deal-detail page.
 *
 * The Pipeline rows use the compact horizontal `StageChips`; the detail page
 * gets room for a vertical timeline with a connecting rail. Both read the same
 * canonical `STAGE_ORDER` / `STAGE_LABELS` and the shared `stageStateClass` /
 * `stageStateIcon` tokens, so the two views never drift. Any stage missing from
 * the input defaults to "upcoming" (mirroring `StageChips`).
 */
function ordered(stages: ProductionStage[]): ProductionStage[] {
  return STAGE_ORDER.map(
    (key) =>
      stages.find((s) => s.key === key) ?? { key, state: "upcoming" as const },
  );
}

const STATE_LABEL: Record<StageState, string> = {
  done: "Done",
  current: "In progress",
  upcoming: "Upcoming",
};

export function StageTimeline({ stages }: { stages: ProductionStage[] }) {
  const items = ordered(stages);

  return (
    <ol className="relative flex flex-col">
      {items.map((s, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={s.key} className="relative flex gap-[14px] pb-5 last:pb-0">
            {/* connecting rail between markers */}
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[10px] top-[22px] h-[calc(100%-14px)] w-[2px] bg-cream-deep"
              />
            )}
            <span
              className={`relative z-10 flex h-[21px] w-[21px] flex-none items-center justify-center rounded-full text-[0.62rem] font-bold text-white ${stageStateClass(
                s.state,
              )} ${s.state === "upcoming" ? "text-gray-dark" : ""}`}
            >
              {stageStateIcon(s.state)}
            </span>
            <div className="-mt-px min-w-0">
              <div
                className={`font-display text-[0.92rem] font-semibold ${
                  s.state === "upcoming" ? "text-gray-mid" : "text-ink"
                }`}
              >
                {STAGE_LABELS[s.key]}
              </div>
              <div className="mt-[1px] text-[0.74rem] font-medium text-gray-mid">
                {STATE_LABEL[s.state]}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
