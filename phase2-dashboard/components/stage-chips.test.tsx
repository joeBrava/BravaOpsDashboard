import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StageChips } from "@/components/stage-chips";
import type { ProductionStage } from "@/lib/types";

const stages: ProductionStage[] = [
  { key: "brick", state: "done" },
  { key: "form", state: "current" },
];

describe("StageChips", () => {
  it("renders all five canonical stage labels", () => {
    render(<StageChips stages={stages} />);
    expect(screen.getByText(/Brick Selection/)).toBeInTheDocument();
    expect(screen.getByText(/Production Form/)).toBeInTheDocument();
    expect(screen.getByText(/Build/)).toBeInTheDocument();
    expect(screen.getByText(/QA \/ Approval/)).toBeInTheDocument();
    expect(screen.getByText(/Ship/)).toBeInTheDocument();
  });

  it("shows the done glyph for completed stages and the current glyph for the active one", () => {
    render(<StageChips stages={stages} />);
    // done -> ✓ , current -> ▷
    expect(screen.getByText(/Brick Selection ✓/)).toBeInTheDocument();
    expect(screen.getByText(/Production Form ▷/)).toBeInTheDocument();
  });

  it("defaults unspecified stages to upcoming (· glyph)", () => {
    render(<StageChips stages={stages} />);
    expect(screen.getByText(/Build ·/)).toBeInTheDocument();
  });
});
