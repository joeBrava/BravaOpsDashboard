/**
 * Domain-lock policy for sign-in.
 *
 * Sign-in is restricted to the Brava Google Workspace: only addresses on
 * `buildbrava.com` may authenticate. These are PURE helpers (no Next/Auth.js
 * imports) so the policy is unit-tested in isolation and reused by the Auth.js
 * `signIn` callback in `auth.ts`.
 */

/** The single Google Workspace domain allowed to sign in. */
export const ALLOWED_DOMAIN = "buildbrava.com" as const;

/**
 * True only when `email` is a well-formed single address whose domain is
 * EXACTLY the allowed domain (case-insensitive). Rejects empty/missing values,
 * malformed addresses, subdomains, and suffix-impersonation
 * (`buildbrava.com.evil.com`, `evilbuildbrava.com`).
 */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  // Exactly one "@", with a non-empty local part and a domain part.
  const at = normalized.indexOf("@");
  if (at <= 0) return false; // no "@", or "@..." with empty local part
  if (normalized.indexOf("@", at + 1) !== -1) return false; // more than one "@"
  const domain = normalized.slice(at + 1);
  return domain === ALLOWED_DOMAIN;
}

/** The subset of a Google OIDC profile this policy cares about. */
export interface GoogleSignInProfile {
  /** Google Workspace hosted-domain claim, present for Workspace accounts. */
  hd?: string | null;
  /** Whether Google has verified the email. */
  email_verified?: boolean | null;
}

/**
 * Authorize a Google sign-in.
 *
 * Authoritative gate: the (verified) email must be on the allowed domain.
 * Defense-in-depth: if Google supplies the `hd` (hosted-domain) claim it MUST
 * also equal the allowed domain; a mismatching `hd` is rejected even if the
 * email parses to the right domain. An explicitly-unverified email
 * (`email_verified === false`) is rejected; an absent flag is treated as
 * acceptable since Google omits it in some profile shapes.
 */
export function isAllowedGoogleSignIn(
  email: string | null | undefined,
  profile: GoogleSignInProfile | null | undefined,
): boolean {
  if (!isAllowedEmail(email)) return false;
  if (profile) {
    if (profile.email_verified === false) return false;
    if (profile.hd != null && profile.hd.trim().toLowerCase() !== ALLOWED_DOMAIN) {
      return false;
    }
  }
  return true;
}
