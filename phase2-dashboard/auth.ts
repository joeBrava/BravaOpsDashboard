/**
 * Auth.js (NextAuth v5) configuration — Google SSO, domain-locked to
 * `buildbrava.com`.
 *
 * Verified against the INSTALLED packages (not memory):
 *   - next-auth@5.0.0-beta.31, @auth/core@0.41.2
 *   - Next.js 16.2.7 (peer range "^14 || ^15 || ^16" — Next 16 is supported)
 *   - `NextAuth(config)` returns `{ handlers, auth, signIn, signOut }`
 *     (see node_modules/next-auth/index.d.ts, NextAuthResult).
 *   - Google provider lives at `next-auth/providers/google`; its `GoogleProfile`
 *     carries the `hd` (hosted-domain) and `email_verified` claims
 *     (node_modules/@auth/core/providers/google.d.ts).
 *
 * The domain-lock policy itself is a pure, unit-tested helper in
 * `lib/auth-domain.ts`; this module only wires it into the `signIn` callback.
 *
 * Secrets/config come from the typed, fail-soft env module. AUTH_SECRET +
 * GOOGLE_CLIENT_ID/SECRET are supplied via .env.local (never committed).
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { GoogleProfile } from "next-auth/providers/google";
import { isAllowedGoogleSignIn } from "@/lib/auth-domain";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // AUTH_SECRET is read automatically by Auth.js from the environment; passing
  // it explicitly keeps everything sourced through our typed env getters.
  secret: env.authSecret(),
  // Auth.js v5 derives the callback origin from the request Host header and, on
  // self-hosted/non-Vercel runtimes (incl. local `next start`), refuses unknown
  // hosts ("UntrustedHost") unless told to trust it. Vercel/Node behind our own
  // reverse proxy sets Host safely, so we trust it. (Auth.js auto-trusts only a
  // few platforms; self-hosted must opt in. See @auth/core trustHost.)
  trustHost: true,
  providers: [
    Google({
      clientId: env.googleClientId(),
      clientSecret: env.googleClientSecret(),
      // Ask Google to scope the account chooser to the Brava Workspace. This is
      // a UX hint only; the authoritative check is the signIn callback below.
      authorization: {
        params: { hd: "buildbrava.com", prompt: "select_account" },
      },
    }),
  ],
  callbacks: {
    /**
     * Domain lock. Reject any sign-in whose email is not on buildbrava.com, and
     * (defense-in-depth) reject when Google's `hd` claim names a different
     * workspace or the email is explicitly unverified. Returning `false` makes
     * Auth.js deny access; returning `true` allows it.
     */
    signIn({ profile, user }) {
      const googleProfile = profile as GoogleProfile | undefined;
      const email = googleProfile?.email ?? user?.email;
      return isAllowedGoogleSignIn(email, googleProfile);
    },
  },
});
