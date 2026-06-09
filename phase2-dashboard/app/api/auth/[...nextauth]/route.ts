/**
 * Auth.js (NextAuth v5) App-Router catch-all route handler.
 *
 * Exposes the OAuth endpoints Auth.js needs (sign-in, callback, sign-out,
 * session, csrf, providers) under `/api/auth/*`. The `handlers` object returned
 * by `NextAuth()` already implements the App-Router `GET`/`POST` route handlers
 * (NextAuthResult.handlers === AppRouteHandlers), so we re-export them directly.
 *
 * Verified against node_modules/next-auth/index.d.ts and the installed v16
 * route-handler convention (app/.../route.ts, GET/POST exports).
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
