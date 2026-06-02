import type { Project, ProjectStatusKey } from "./types";

export const projects: Project[] = [
  {
    id: "salt-lake-temple",
    name: "Salt Lake Temple",
    owner: "Joe Z.",
    ownerInitials: "JZ",
    status: "on_track",
    stages: [
      { key: "brick", state: "done" },
      { key: "form", state: "done" },
      { key: "build", state: "current" },
      { key: "qa", state: "upcoming" },
      { key: "ship", state: "upcoming" },
    ],
    note: "Build underway",
    nextStep: "next: QA review",
  },
  {
    id: "acme-corp-q3",
    name: "Acme Corp Q3",
    owner: "Miya A.",
    ownerInitials: "MA",
    status: "at_risk",
    stages: [
      { key: "brick", state: "done" },
      { key: "form", state: "current" },
      { key: "build", state: "upcoming" },
      { key: "qa", state: "upcoming" },
      { key: "ship", state: "upcoming" },
    ],
    note: "Production Form awaiting approval · 3d",
  },
  {
    id: "big-customer-logo",
    name: "Big Customer Logo",
    owner: "Miya A.",
    ownerInitials: "MA",
    status: "blocked",
    stages: [
      { key: "brick", state: "done" },
      { key: "form", state: "done" },
      { key: "build", state: "done" },
      { key: "qa", state: "current" },
      { key: "ship", state: "upcoming" },
    ],
    blocker: "⚠️ QA flagged a color mismatch",
  },
  {
    id: "riverside-plaza",
    name: "Riverside Plaza",
    owner: "Joe Z.",
    ownerInitials: "JZ",
    status: "shipping",
    stages: [
      { key: "brick", state: "done" },
      { key: "form", state: "done" },
      { key: "build", state: "done" },
      { key: "qa", state: "done" },
      { key: "ship", state: "current" },
    ],
    note: "Out for delivery · ETA Fri",
  },
];

function countStatus(status: ProjectStatusKey): number {
  return projects.filter((p) => p.status === status).length;
}

export const summary = {
  inProduction: projects.length,
  onTrack: countStatus("on_track"),
  needsAttention: countStatus("at_risk") + countStatus("blocked"),
  shipping: countStatus("shipping"),
};

export const recentUpdate =
  "📦 Riverside Plaza moved to Shipping — out for delivery today";
