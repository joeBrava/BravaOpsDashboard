import { deriveStatus } from "./deal-status";
import type { Deal } from "./types";

interface RawDeal extends Omit<Deal, "inProduction"> {
  inProduction?: boolean;
}

const raw: RawDeal[] = [
  {
    id: "salt-lake-temple",
    name: "Salt Lake Temple",
    owner: "Joe Z.",
    ownerInitials: "JZ",
    inProduction: true,
    milestones: [
      { key: "design", state: "paid" },
      { key: "p1", state: "paid" },
      { key: "p2", state: "pending" },
    ],
    location: "📍 Brick Selection complete",
    nextStep: "next: Production Form approval",
  },
  {
    id: "acme-corp-q3",
    name: "Acme Corp Q3",
    owner: "Miya A.",
    ownerInitials: "MA",
    milestones: [
      { key: "design", state: "paid" },
      { key: "p1", state: "unpaid", note: "(3d)" },
      { key: "p2", state: "na" },
    ],
    location: "📍 Design phase",
    nextStep: "production unlocks when P1 clears",
  },
  {
    id: "big-customer-logo",
    name: "Big Customer Logo",
    owner: "Miya A.",
    ownerInitials: "MA",
    milestones: [
      { key: "design", state: "unpaid", note: "(8d)" },
      { key: "p1", state: "na" },
      { key: "p2", state: "na" },
    ],
    blocker: "⚠️ Design can't start until the deposit is paid",
  },
];

export const deals: Deal[] = raw.map((d) => ({
  ...d,
  inProduction: d.inProduction ?? false,
}));

/** Convenience: status key per deal (used by the page + cards). */
export function dealStatusKey(d: Deal) {
  return deriveStatus(d.milestones, d.inProduction ?? false);
}

export const summary = {
  active: deals.length,
  readyToMove: 2,
  blocked: 1,
  paidYesterday: "$4,250",
};

export const recentPayment =
  "💸 Yesterday — Salt Lake Temple P1 payment cleared ($4,250)";
