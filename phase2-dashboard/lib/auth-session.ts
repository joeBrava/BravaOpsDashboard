import { isAuthDisabled } from "@/lib/env";
import {
  currentUserFrom,
  stubUser,
  type SessionUser,
} from "@/lib/session-user";

/**
 * Resolve the current display user for server components. Server-only: it
 * lazily imports the Auth.js config (`@/auth`), so it must never run on the
 * client. It is only invoked from the async root layout.
 *
 * - When auth is bypassed (`AUTH_DISABLED=true`, dev only) we never touch
 *   Auth.js and return a clearly-labeled stub user, so the app renders before
 *   OAuth is configured.
 * - Otherwise we read the Auth.js session via `auth()` and map it through the
 *   pure `currentUserFrom` helper. Returns `null` when nobody is signed in.
 *
 * `auth` is imported lazily so that bypass mode does not load the Auth.js
 * config (which expects secrets) at all. The display/derivation logic lives in
 * the unit-tested pure helpers; this module only does the wiring.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isAuthDisabled()) return stubUser();
  const { auth } = await import("@/auth");
  const session = await auth();
  return currentUserFrom(session);
}
