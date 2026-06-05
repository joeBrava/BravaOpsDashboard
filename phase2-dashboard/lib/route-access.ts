/**
 * Pure route-gate policy used by `proxy.ts` (Next 16's renamed `middleware`).
 *
 * No Next/Auth.js imports so the access decision is unit-tested in isolation;
 * `proxy.ts` only does the request/response wiring around these helpers.
 */

/**
 * Paths that must be reachable without a session: the sign-in page itself, all
 * Auth.js OAuth endpoints, and framework/static assets. Everything else is
 * protected. (The proxy `matcher` already excludes most static assets, but we
 * keep this list defensive so the policy is correct on its own.)
 */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/signin") return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export interface RouteAccessInput {
  pathname: string;
  /** AUTH_DISABLED dev bypass — when true, nothing is gated. */
  authDisabled: boolean;
  /** Whether the request carries a valid Auth.js session. */
  hasSession: boolean;
}

export type RouteAccessDecision =
  | { action: "allow" }
  | { action: "redirect"; to: "/signin" };

/**
 * Decide whether a request may proceed.
 *
 * - Dev bypass (`authDisabled`) → always allow (the smoke gate runs here, so
 *   `/` must render the Pipeline and never bounce to `/signin`).
 * - Public paths → always allow (so `/signin` and the OAuth callback work for
 *   signed-out visitors).
 * - Protected path with a session → allow.
 * - Protected path without a session → redirect to `/signin`.
 */
export function decideRouteAccess(
  input: RouteAccessInput,
): RouteAccessDecision {
  if (input.authDisabled) return { action: "allow" };
  if (isPublicPath(input.pathname)) return { action: "allow" };
  if (input.hasSession) return { action: "allow" };
  return { action: "redirect", to: "/signin" };
}
