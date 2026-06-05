/**
 * Owner-filter logic for the Pipeline view.
 *
 * The Pipeline defaults to the signed-in user's own projects ("Mine"), with a
 * visible toggle to "All team" (privacy is waived — every rep may view every
 * pipeline; see the design spec). This module is the PURE, unit-tested core of
 * that behavior so the React component stays a thin shell.
 *
 * Matching a session user to the projects they own is a join on initials:
 * fixtures key ownership by `Project.ownerInitials` (e.g. "JZ"), and the live
 * mapper populates the same field from the HubSpot owner. The session user's
 * `initials` are computed the same way (see `session-user.ts`), so an
 * initials match is the natural, source-agnostic join. Comparison is
 * case-insensitive and whitespace-trimmed; an empty/"?" identity matches
 * nothing (so a not-yet-identified user sees an empty "Mine", never the whole
 * board by accident).
 */
import type { Project } from "./types";

/** The two Pipeline scopes. "mine" is the default; "all" shows every owner. */
export type OwnerView = "mine" | "all";

/** The default scope: the signed-in user's own projects. */
export const DEFAULT_OWNER_VIEW: OwnerView = "mine";

/** The minimal identity this module needs to resolve ownership. */
export interface OwnerIdentity {
  initials: string;
}

function normalizeInitials(value: string | null | undefined): string {
  const v = (value ?? "").trim().toUpperCase();
  // "?" is the session-user sentinel for "no usable identity"; treat as empty
  // so it never matches a real owner.
  return v === "?" ? "" : v;
}

/**
 * Does `project` belong to `user`? False when either side has no usable
 * identity, so an unidentified user owns nothing.
 */
export function ownsProject(
  project: Project,
  user: OwnerIdentity | null | undefined,
): boolean {
  const mine = normalizeInitials(user?.initials);
  if (mine === "") return false;
  return normalizeInitials(project.ownerInitials) === mine;
}

/**
 * Filter projects for the chosen scope.
 *
 * - "all"  → every project, unchanged.
 * - "mine" → only projects the user owns. If the user is unknown (no usable
 *   initials), "mine" is empty rather than silently falling back to everyone.
 */
export function filterProjectsByOwner(
  projects: Project[],
  view: OwnerView,
  user: OwnerIdentity | null | undefined,
): Project[] {
  if (view === "all") return projects;
  return projects.filter((p) => ownsProject(p, user));
}

/** Count how many of `projects` the user owns (for the "Mine (n)" label). */
export function countOwned(
  projects: Project[],
  user: OwnerIdentity | null | undefined,
): number {
  return projects.reduce((n, p) => (ownsProject(p, user) ? n + 1 : n), 0);
}
