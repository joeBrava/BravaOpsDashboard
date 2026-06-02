import type { DealStatusKey, Milestone, MilestoneKey, PaymentState } from "./types";

function stateOf(milestones: Milestone[], key: MilestoneKey): PaymentState {
  return milestones.find((m) => m.key === key)?.state ?? "na";
}

/** Derive the overall status of a deal from its payment milestones. */
export function deriveStatus(
  milestones: Milestone[],
  inProduction: boolean,
): DealStatusKey {
  const design = stateOf(milestones, "design");
  const p1 = stateOf(milestones, "p1");

  if (design !== "paid") return "blocked";
  if (p1 !== "paid") return "awaiting";
  return inProduction ? "in_production" : "ready";
}

export interface StatusMeta {
  label: string;
  /** Tailwind class for the card's left edge color */
  edgeClass: string;
  /** Tailwind classes for the status pill (bg + text) */
  pillClass: string;
  /** Tailwind class for the pill's leading dot */
  dotClass: string;
}

const META: Record<DealStatusKey, StatusMeta> = {
  in_production: {
    label: "In Production",
    edgeClass: "border-l-lime",
    pillClass: "bg-[#d7f4f2] text-[#00726e]",
    dotClass: "bg-teal",
  },
  ready: {
    label: "Ready to move",
    edgeClass: "border-l-lime",
    pillClass: "bg-[#f1f5ce] text-[#5c6a00]",
    dotClass: "bg-lime",
  },
  awaiting: {
    label: "Awaiting payment",
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
};

export function getStatusMeta(key: DealStatusKey): StatusMeta {
  return META[key];
}

/** Tailwind dot color for a single milestone chip. */
export function milestoneDotClass(state: PaymentState): string {
  switch (state) {
    case "paid":
      return "bg-lime";
    case "pending":
      return "bg-gold";
    case "unpaid":
      return "bg-danger";
    default:
      return "bg-gray-light";
  }
}
