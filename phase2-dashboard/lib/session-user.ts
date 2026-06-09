/**
 * Presentation-layer user derived from an auth session (or the dev-bypass stub).
 *
 * These are PURE helpers (no Next/Auth.js imports) so the display logic — name,
 * email, and computed initials for the sidebar profile slot — is unit-tested in
 * isolation. `app/layout.tsx` calls `auth()` (or uses the stub when
 * `isAuthDisabled()`) and feeds the result through `currentUserFrom()`.
 */

/** The minimal user shape the UI needs to render the sidebar profile slot. */
export interface SessionUser {
  /** display name, falling back to the email local-part, then "Signed in" */
  name: string;
  /** email address if known, else undefined */
  email?: string;
  /** 1–2 character avatar initials, always uppercase */
  initials: string;
  /** small caption under the name (e.g. "Sales", or "Dev (auth off)") */
  role: string;
}

/** The subset of an Auth.js session this helper reads. */
export interface SessionLike {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

/**
 * Compute avatar initials from a name or email.
 *
 * - A multi-word name uses the first letter of the first and last words.
 * - A single-word name uses its first (up to two) letters.
 * - With no usable name, the email local-part is used the same way.
 * - Nothing usable → "?".
 * Always uppercase; never more than two characters.
 */
export function initialsFor(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const source = (name && name.trim()) || localPart(email) || "";
  const words = source.split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function localPart(email: string | null | undefined): string {
  if (!email) return "";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

/**
 * Derive the display user from a (possibly null) session.
 *
 * Returns `null` when there is no authenticated user, so callers can decide
 * what to render for the signed-out state. The name falls back to the email
 * local-part, then to "Signed in"; initials are computed via `initialsFor`.
 */
export function currentUserFrom(
  session: SessionLike | null | undefined,
): SessionUser | null {
  const u = session?.user;
  if (!u || (!u.name && !u.email)) return null;
  const email = u.email ?? undefined;
  const name = (u.name && u.name.trim()) || localPart(email) || "Signed in";
  return {
    name,
    email,
    initials: initialsFor(u.name, email),
    role: "Sales",
  };
}

/**
 * The placeholder user shown when auth is bypassed (`AUTH_DISABLED=true`).
 * Uses a buildbrava.com address so the rest of the app's owner/domain logic
 * behaves as it would for a real signed-in rep, and labels the mode clearly.
 */
export function stubUser(): SessionUser {
  return {
    name: "Dev User",
    email: "dev@buildbrava.com",
    initials: "DU",
    role: "Dev (auth off)",
  };
}
