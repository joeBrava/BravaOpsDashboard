export type ProductionStageKey = "brick" | "form" | "build" | "qa" | "ship";

export type StageState = "done" | "current" | "upcoming";

export interface ProductionStage {
  key: ProductionStageKey;
  state: StageState;
}

export type ProjectStatusKey = "on_track" | "at_risk" | "blocked" | "shipping";

export interface Project {
  id: string;
  name: string;
  owner: string;
  ownerInitials: string;
  stages: ProductionStage[];
  /** explicit project health (not derived from stages) */
  status: ProjectStatusKey;
  /** short context line */
  note?: string;
  /** "next: …" line */
  nextStep?: string;
  /** "⚠️ …" blocker line (present when blocked) */
  blocker?: string;
}
