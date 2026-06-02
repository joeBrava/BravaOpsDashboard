import { milestoneDotClass } from "@/lib/deal-status";
import type { Milestone } from "@/lib/types";

const LABEL: Record<Milestone["key"], string> = {
  design: "Design",
  p1: "P1",
  p2: "P2",
};

function chipText(m: Milestone): string {
  const base = LABEL[m.key];
  switch (m.state) {
    case "paid":
      return `${base} ✓`;
    case "pending":
      return `${base} pending`;
    case "unpaid":
      return `${base} unpaid${m.note ? ` ${m.note}` : ""}`;
    default:
      return `${base} —`;
  }
}

export function MilestoneChips({ milestones }: { milestones: Milestone[] }) {
  return (
    <>
      {milestones.map((m) => (
        <span
          key={m.key}
          className="inline-flex items-center gap-[6px] text-[0.78rem] font-medium text-gray-dark"
        >
          <span
            className={`h-[7px] w-[7px] rounded-full ${milestoneDotClass(m.state)}`}
          />
          {chipText(m)}
        </span>
      ))}
    </>
  );
}
