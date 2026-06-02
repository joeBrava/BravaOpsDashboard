import { getStatusMeta } from "@/lib/deal-status";
import type { Deal, DealStatusKey } from "@/lib/types";
import { MilestoneChips } from "./milestone-chips";
import { StatusPill } from "./status-pill";

interface DealCardProps {
  deal: Deal;
  statusKey: DealStatusKey;
}

export function DealCard({ deal, statusKey }: DealCardProps) {
  const meta = getStatusMeta(statusKey);
  const needsAction = statusKey === "blocked";
  const context = deal.blocker
    ? deal.blocker
    : [deal.location, deal.nextStep].filter(Boolean).join(" — ");

  return (
    <div
      className={`flex items-center gap-[18px] rounded-[15px] border-l-[5px] bg-white px-[18px] py-4 shadow-[0_4px_14px_rgba(50,35,80,0.05)] ${meta.edgeClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-[9px] flex items-center gap-[11px]">
          <span className="font-display text-[1.02rem] font-bold text-ink">
            {deal.name}
          </span>
          <StatusPill
            label={meta.label}
            pillClass={meta.pillClass}
            dotClass={meta.dotClass}
          />
        </div>
        <div className="flex flex-wrap items-center gap-[15px]">
          <MilestoneChips milestones={deal.milestones} />
          {context && (
            <span className="text-[0.78rem] font-medium text-gray-mid">
              · {context}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        className={`flex-none whitespace-nowrap rounded-[10px] px-4 py-[9px] font-display text-[0.8rem] font-semibold ${
          needsAction
            ? "bg-purple text-white"
            : "border-[1.5px] border-[#ebe6dd] bg-white text-purple"
        }`}
      >
        {needsAction ? "Send reminder" : "View"}
      </button>
    </div>
  );
}
