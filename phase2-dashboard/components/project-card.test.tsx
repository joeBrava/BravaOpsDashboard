import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/lib/types";

const onTrack: Project = {
  id: "salt-lake-temple",
  name: "Salt Lake Temple",
  owner: "Joe Brava",
  ownerInitials: "JB",
  status: "on_track",
  stages: [
    { key: "brick", state: "done" },
    { key: "form", state: "current" },
  ],
  note: "Awaiting client sign-off",
};

const blocked: Project = {
  ...onTrack,
  id: "acme-corp-q3",
  name: "Acme Corp Q3",
  status: "blocked",
  blocker: "Missing brand assets",
};

describe("ProjectCard", () => {
  it("renders the project name and its status pill label", () => {
    render(<ProjectCard project={onTrack} />);
    expect(screen.getByText("Salt Lake Temple")).toBeInTheDocument();
    expect(screen.getByText("On track")).toBeInTheDocument();
  });

  it("links the whole card to the deal-detail page", () => {
    render(<ProjectCard project={onTrack} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/deals/salt-lake-temple");
  });

  it('shows a "View" action for healthy projects', () => {
    render(<ProjectCard project={onTrack} />);
    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it('shows a "Follow up" action and the blocker for blocked projects', () => {
    render(<ProjectCard project={blocked} />);
    expect(screen.getByText("Follow up")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText(/Missing brand assets/)).toBeInTheDocument();
  });
});
