/**
 * Route gate — Next.js 16's renamed `middleware` convention.
 *
 * In Next.js 16 the `middleware` file convention is DEPRECATED and renamed to
 * `proxy` (see node_modules/next/dist/docs/.../proxy.md and the v16 upgrade
 * guide: "Rename your middleware file: mv middleware.ts proxy.ts"). The named
 * export is `proxy`, and the runtime is fixed to Node.js (the `edge` runtime is
 * not supported in `proxy`). We use the installed convention, not memory.
 *
 * Policy (pure, unit-tested in `lib/route-access.ts`):
 *   - AUTH_DISABLED=true (dev bypass) → pass everything through. The verification
 *     gate runs in this mode, so `/` must render the Pipeline and never bounce
 *     to `/signin`. In this branch we NEVER import the Auth.js config, so the
 *     app boots with no secrets configured.
 *   - Otherwise: public paths (`/signin`, `/api/auth/*`, assets) pass through;
 *     a request to a protected path with a valid session passes through; an
 *     unauthenticated request to a protected path is redirected to `/signin`.
 *
 * The authoritative domain lock lives in the Auth.js `signIn` callback
 * (`auth.ts`); this gate only enforces "is there a session at all".
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthDisabled } from "@/lib/env";
import { decideRouteAccess, isPublicPath } from "@/lib/route-access";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev bypass: allow everything, and crucially do not load Auth.js (no secrets
  // required to run locally).
  if (isAuthDisabled()) {
    return NextResponse.next();
  }

  // Public paths never need a session check.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Auth enabled: read the session via Auth.js. Lazy import so bypass mode above
  // never pulls the provider config (which expects secrets) into the proxy.
  const { auth } = await import("@/auth");
  const session = await auth();

  const decision = decideRouteAccess({
    pathname,
    authDisabled: false,
    hasSession: Boolean(session?.user),
  });

  if (decision.action === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = decision.to;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Run the gate on every route except framework/static assets and the Auth.js
 * endpoints. The negative-lookahead pattern is the v16-documented way to exclude
 * `_next/static`, `_next/image`, the OAuth endpoints under `/api/auth`, and
 * common metadata files so CSS/JS/images and sign-in are never blocked.
 */
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
