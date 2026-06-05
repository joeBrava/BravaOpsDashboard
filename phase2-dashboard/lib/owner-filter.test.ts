import { describe, it, expect } from "vitest";
import {
  ownsProject,
  filterProjectsByOwner,
  countOwned,
  DEFAULT_OWNER_VIEW,
} from "./owner-filter";
import type { Project } from "./types";

function project(id: string, ownerInitials: string): Project {
  return {
    id,
    name: id,
    owner: id,
    ownerInitials,
    status: "on_track",
    stages: [],
  };
}

const board: Project[] = [
  project("a", "JZ"),
  project("b", "MA"),
  project("c", "JZ"),
  project("d", "ma"), // lower-case to exercise case-insensitivity
];

describe("DEFAULT_OWNER_VIEW", () => {
  it("defaults to the signed-in user's own pipeline", () => {
    expect(DEFAULT_OWNER_VIEW).toBe("mine");
  });
});

describe("ownsProject", () => {
  it("matches on initials, case-insensitively", () => {
    expect(ownsProject(project("x", "JZ"), { initials: "jz" })).toBe(true);
    expect(ownsProject(project("x", "jz"), { initials: "JZ" })).toBe(true);
  });

  it("does not match a different owner", () => {
    expect(ownsProject(project("x", "JZ"), { initials: "MA" })).toBe(false);
  });

  it("never matches when the user has no usable identity", () => {
    expect(ownsProject(project("x", "JZ"), null)).toBe(false);
    expect(ownsProject(project("x", "JZ"), undefined)).toBe(false);
    expect(ownsProject(project("x", "JZ"), { initials: "" })).toBe(false);
    expect(ownsProject(project("x", "JZ"), { initials: "  " })).toBe(false);
    expect(ownsProject(project("x", "JZ"), { initials: "?" })).toBe(false);
  });

  it("never matches an owner-less project", () => {
    expect(ownsProject(project("x", ""), { initials: "JZ" })).toBe(false);
  });
});

describe("filterProjectsByOwner", () => {
  it("'all' returns every project unchanged", () => {
    expect(filterProjectsByOwner(board, "all", { initials: "JZ" })).toEqual(
      board,
    );
    // even with no user, "all" shows everyone (privacy waived)
    expect(filterProjectsByOwner(board, "all", null)).toEqual(board);
  });

  it("'mine' returns only the user's projects (case-insensitive)", () => {
    const mine = filterProjectsByOwner(board, "mine", { initials: "JZ" });
    expect(mine.map((p) => p.id)).toEqual(["a", "c"]);

    const miya = filterProjectsByOwner(board, "mine", { initials: "MA" });
    expect(miya.map((p) => p.id)).toEqual(["b", "d"]);
  });

  it("'mine' is empty for an unknown user (no silent fall-through to all)", () => {
    expect(filterProjectsByOwner(board, "mine", null)).toEqual([]);
    expect(filterProjectsByOwner(board, "mine", { initials: "?" })).toEqual([]);
  });
});

describe("countOwned", () => {
  it("counts the projects the user owns", () => {
    expect(countOwned(board, { initials: "JZ" })).toBe(2);
    expect(countOwned(board, { initials: "MA" })).toBe(2);
    expect(countOwned(board, { initials: "ZZ" })).toBe(0);
    expect(countOwned(board, null)).toBe(0);
  });
});
