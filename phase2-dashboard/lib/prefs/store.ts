/**
 * Persisted, per-user dashboard preferences.
 *
 * The shape is intentionally small and serializable (plain JSON) so any backing
 * store — a local JSON file today, Postgres/Vercel KV in production — can hold it
 * without bespoke serialization.
 */
export interface Preferences {
  /** Pipeline default: just my deals, or the whole team. */
  defaultView: "mine" | "all";
  /** Colour scheme. "system" follows the OS preference. */
  theme: "system" | "light" | "dark";
  /** Layout density for card lists. */
  density: "comfortable" | "compact";
  /** Phase-1 daily-digest notification opt-in (inert until Phase 1 ships). */
  notifyDigest: boolean;
  /** Phase-1 real-time-alerts opt-in (inert until Phase 1 ships). */
  notifyAlerts: boolean;
}

/**
 * Read/write contract for per-user preferences, keyed by the signed-in user's
 * email (the same identity Auth.js hands us).
 *
 * IMPORTANT — production storage:
 *   The local implementation (`JsonPreferencesStore`) writes a JSON file under a
 *   gitignored data dir. That is fine for local dev and a single long-lived Node
 *   process, but it is WRONG for an ephemeral serverless filesystem like Vercel,
 *   where each invocation may get a fresh, read-only-ish, non-shared disk that is
 *   wiped between requests. Before deploying, swap the implementation behind THIS
 *   interface for a durable backend — Postgres (e.g. Supabase/Neon) or Vercel KV.
 *   Nothing above `PreferencesStore` should need to change: keep the swap inside
 *   `getPreferencesStore()`.
 */
export interface PreferencesStore {
  /** Current preferences for a user; the documented defaults when none are set. */
  get(userEmail: string): Promise<Preferences>;
  /** Persist a full preference set for a user (overwrites any prior value). */
  set(userEmail: string, prefs: Preferences): Promise<void>;
}

import { JsonPreferencesStore } from "./json-store";

/**
 * Selector for the active `PreferencesStore`.
 *
 * Today this always returns the dependency-free JSON-file store. When a durable
 * backend exists (see the note on `PreferencesStore`), branch here on an env var
 * (e.g. `PREFS_STORE=kv`) and return the production implementation — callers,
 * route handlers, and pages keep importing only this selector and the interface.
 *
 * Server-only: the JSON store pulls in Node's `fs`, so this must be called from
 * server components / route handlers (never a `"use client"` module). The
 * resolved instance is memoized for the lifetime of the process.
 */
let memo: PreferencesStore | undefined;

export function getPreferencesStore(): PreferencesStore {
  if (!memo) {
    memo = new JsonPreferencesStore();
  }
  return memo;
}

/** Test seam: drop the memoized store (used by selector tests). */
export function __resetPreferencesStoreForTests(): void {
  memo = undefined;
}
