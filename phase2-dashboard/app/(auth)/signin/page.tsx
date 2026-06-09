import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { isAuthDisabled } from "@/lib/env";
import { ALLOWED_DOMAIN } from "@/lib/auth-domain";

export const metadata: Metadata = {
  title: "Sign in — Biz Bricks Ops",
  description: "Sign in with your Brava Brands Google account.",
};

/**
 * Branded "Cockpit on cream" sign-in screen.
 *
 * A Server Component: the actual sign-in is a `"use server"` action that calls
 * Auth.js `signIn("google", …)` and lets Auth.js handle the OAuth redirect. The
 * authoritative domain lock lives in the Auth.js `signIn` callback
 * (`auth.ts` → `isAllowedGoogleSignIn`); the copy here just sets expectations.
 *
 * The page itself ALWAYS renders (so `/signin` is reachable and verifiable even
 * in the dev-bypass smoke gate). When auth is bypassed for local dev
 * (`AUTH_DISABLED=true`) there is no OAuth to run, so the button just sends the
 * visitor straight to the dashboard — and we never import the Auth.js config in
 * that branch, keeping the app runnable with no secrets configured.
 */
export default function SignInPage() {
  async function signInWithGoogle() {
    "use server";
    if (isAuthDisabled()) {
      // No OAuth in dev bypass — go straight to the dashboard.
      redirect("/");
    }
    // Lazy import keeps the Auth.js config (which expects secrets) out of the
    // bypass branch above.
    const { signIn } = await import("@/auth");
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-[400px]">
        {/* Brand lockup */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-purple-deep to-[#52218c]">
            <BrandMark className="h-7 w-7" />
          </span>
          <span className="font-display text-xl font-extrabold text-ink">
            Biz Bricks Ops
          </span>
        </div>

        {/* Card */}
        <div className="rounded-[18px] border border-cream-deep bg-white p-8 shadow-[0_14px_40px_-18px_rgba(35,35,42,0.35)]">
          <h1 className="font-display text-[1.45rem] font-extrabold leading-tight text-ink">
            Welcome to the cockpit
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-dark">
            Pipeline and invoice visibility for the Brava Brands team. Sign in
            with your{" "}
            <span className="font-semibold text-purple-deep">
              @{ALLOWED_DOMAIN}
            </span>{" "}
            Google account.
          </p>

          <form action={signInWithGoogle} className="mt-7">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-light bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2"
            >
              <GoogleGlyph />
              Continue with Google
            </button>
          </form>

          <p className="mt-5 text-center text-[0.72rem] leading-relaxed text-gray-mid">
            Restricted to the Brava Brands Google Workspace. Accounts outside{" "}
            <span className="font-medium">@{ALLOWED_DOMAIN}</span> are declined.
          </p>
        </div>

        <p className="mt-6 text-center text-[0.72rem] text-gray-mid">
          Trouble signing in?{" "}
          <Link
            href="https://workspace.google.com"
            className="font-medium text-purple-deep underline-offset-2 hover:underline"
          >
            Contact your workspace admin
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

/** The Google "G" mark, inline so the button needs no asset/network fetch. */
function GoogleGlyph() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      className="flex-none"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
