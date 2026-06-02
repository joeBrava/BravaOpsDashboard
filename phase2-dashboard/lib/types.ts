export type PaymentState = "paid" | "unpaid" | "pending" | "na";

export type MilestoneKey = "design" | "p1" | "p2";

export interface Milestone {
  key: MilestoneKey;
  state: PaymentState;
  /** short trailing note, e.g. "(8d)" */
  note?: string;
}

export type DealStatusKey = "in_production" | "ready" | "awaiting" | "blocked";

export interface Deal {
  id: string;
  name: string;
  owner: string;
  ownerInitials: string;
  milestones: Milestone[];
  /** "📍 …" context line */
  location?: string;
  nextStep?: string;
  /** "⚠️ …" blocker line (present when blocked) */
  blocker?: string;
  /** true once design + P1 are paid and the project is being built */
  inProduction?: boolean;
}
