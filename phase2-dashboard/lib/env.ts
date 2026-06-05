/**
 * Typed, fail-soft access to environment configuration.
 *
 * Nothing here throws on a missing variable: the app degrades to fixtures and
 * auth-bypass so it always boots locally without any secrets configured. Live
 * data and real auth switch on only when their inputs are fully present.
 */

export type DataSourceMode = "fixture" | "live";

/** Read an env var, treating empty/whitespace as absent. */
function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v : undefined;
}

export const env = {
  hubspotToken: () => read("HUBSPOT_API_TOKEN"),
  teamworkToken: () => read("TEAMWORK_API_TOKEN"),
  teamworkDomain: () => read("TEAMWORK_DOMAIN") ?? "bravabrands.teamwork.com",
  authSecret: () => read("AUTH_SECRET"),
  googleClientId: () => read("GOOGLE_CLIENT_ID"),
  googleClientSecret: () => read("GOOGLE_CLIENT_SECRET"),
};

/** True only when BOTH live read-only API tokens are present. */
export function hasLiveCredentials(): boolean {
  return Boolean(env.hubspotToken() && env.teamworkToken());
}

let warnedDowngrade = false;

/**
 * Resolve the active data-source mode.
 *
 * Live only when explicitly requested (`DATA_SOURCE=live`) AND both tokens are
 * present; otherwise fixtures. If live is requested but tokens are missing, we
 * downgrade to fixtures and warn once (so a misconfigured deploy is visible in
 * logs without crashing a page).
 */
export function getDataSourceMode(): DataSourceMode {
  const requested = read("DATA_SOURCE")?.toLowerCase();
  if (requested === "live") {
    if (hasLiveCredentials()) return "live";
    if (!warnedDowngrade) {
      warnedDowngrade = true;
      console.warn(
        "[env] DATA_SOURCE=live but HUBSPOT_API_TOKEN/TEAMWORK_API_TOKEN are missing — falling back to fixtures.",
      );
    }
    return "fixture";
  }
  return "fixture";
}

/**
 * Whether auth is bypassed. Fail-CLOSED: only an explicit `AUTH_DISABLED=true`
 * bypasses sign-in (intended for local dev). A deploy that simply forgot to
 * configure Google OAuth does NOT silently become public — sign-in will fail
 * closed instead.
 */
export function isAuthDisabled(): boolean {
  return read("AUTH_DISABLED") === "true";
}
