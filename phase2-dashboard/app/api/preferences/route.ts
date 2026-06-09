/**
 * Per-user preferences API (`/api/preferences`).
 *
 * - GET  → the signed-in user's saved `Preferences` (documented defaults if unset).
 * - PUT  → validate the JSON body against the `Preferences` shape and persist it.
 *
 * Identity comes from `getCurrentUser()`, which returns the real Auth.js session
 * user normally and a clearly-labeled stub (`dev@buildbrava.com`) when auth is
 * bypassed (`AUTH_DISABLED=true`). Storage goes through `getPreferencesStore()`,
 * so the durable-backend swap documented on `PreferencesStore` is transparent here.
 *
 * Route Handlers are not cached by default in this Next.js (15+ behavior, confirmed
 * against node_modules/next/dist/docs/.../15-route-handlers.md), and both handlers
 * read request-time session state, so no caching opt-in is needed. We export GET/PUT
 * per the installed route.ts convention; unsupported verbs auto-405.
 */
import { getCurrentUser } from "@/lib/auth-session";
import { getPreferencesStore } from "@/lib/prefs/store";
import type { Preferences } from "@/lib/prefs/store";

/** Run on Node (the JSON store uses `node:fs`); never prerender. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resolve the signed-in user's email, or null when nobody is signed in. */
async function currentEmail(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.email ?? null;
}

/** Allowed values for each enumerated field, used by `validatePreferences`. */
const DEFAULT_VIEW = ["mine", "all"] as const;
const THEME = ["system", "light", "dark"] as const;
const DENSITY = ["comfortable", "compact"] as const;

/**
 * Validate an unknown body against the `Preferences` shape.
 *
 * Returns the typed, normalized object on success (extra keys dropped), or an
 * error string describing the first problem. Strict: every field is required and
 * must be one of the documented values — a partial/loose body is rejected rather
 * than silently merged, so a PUT always stores a complete, well-formed record.
 */
function validatePreferences(
  body: unknown,
): { ok: true; value: Preferences } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (!DEFAULT_VIEW.includes(b.defaultView as (typeof DEFAULT_VIEW)[number])) {
    return { ok: false, error: `defaultView must be one of ${DEFAULT_VIEW.join(", ")}.` };
  }
  if (!THEME.includes(b.theme as (typeof THEME)[number])) {
    return { ok: false, error: `theme must be one of ${THEME.join(", ")}.` };
  }
  if (!DENSITY.includes(b.density as (typeof DENSITY)[number])) {
    return { ok: false, error: `density must be one of ${DENSITY.join(", ")}.` };
  }
  if (typeof b.notifyDigest !== "boolean") {
    return { ok: false, error: "notifyDigest must be a boolean." };
  }
  if (typeof b.notifyAlerts !== "boolean") {
    return { ok: false, error: "notifyAlerts must be a boolean." };
  }

  return {
    ok: true,
    value: {
      defaultView: b.defaultView as Preferences["defaultView"],
      theme: b.theme as Preferences["theme"],
      density: b.density as Preferences["density"],
      notifyDigest: b.notifyDigest,
      notifyAlerts: b.notifyAlerts,
    },
  };
}

export async function GET(): Promise<Response> {
  const email = await currentEmail();
  if (!email) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }
  const prefs = await getPreferencesStore().get(email);
  return Response.json(prefs, { status: 200 });
}

export async function PUT(request: Request): Promise<Response> {
  const email = await currentEmail();
  if (!email) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validatePreferences(body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  await getPreferencesStore().set(email, result.value);
  return Response.json(result.value, { status: 200 });
}
