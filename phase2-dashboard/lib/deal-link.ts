/**
 * Deal-detail link helpers.
 *
 * The deal detail page lives at `/deals/[id]` where `id` is the project id.
 * Two pure helpers feed the linking on the Pipeline + Invoices views:
 *
 * - `dealHref(id)` — the canonical path for a project's detail page.
 * - `projectIdForDealName(projects, dealName)` — resolves the project id an
 *   invoice should link to. Invoices carry only a `dealName` (the fixtures key
 *   `Invoice.dealName === Project.name`; the live mapper populates the same
 *   field from the HubSpot deal name), so the page maps it back to an id using
 *   the projects it already fetched. Source-agnostic by construction: it takes
 *   the project list as input rather than reaching into a concrete source.
 *
 * Matching is case-insensitive + whitespace-trimmed; an unmatched name yields
 * `undefined` so the caller renders the card without a link rather than a dead
 * one.
 */
import type { Project } from "./types";

/** Canonical path to a project's deal-detail page. */
export function dealHref(id: string): string {
  return `/deals/${id}`;
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Resolve the project id an invoice (identified by its `dealName`) links to,
 * or `undefined` when no project matches.
 */
export function projectIdForDealName(
  projects: Project[],
  dealName: string | null | undefined,
): string | undefined {
  const target = normalizeName(dealName);
  if (target === "") return undefined;
  return projects.find((p) => normalizeName(p.name) === target)?.id;
}
