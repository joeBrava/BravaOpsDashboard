import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Preferences, PreferencesStore } from "./store";

/**
 * Dependency-free, JSON-file-backed `PreferencesStore`.
 *
 * Deliberately uses ONLY Node's built-in `fs`/`path` — no `better-sqlite3` or any
 * other native module — so the app needs no native build step. The whole store is
 * a single JSON object `{ [userEmail]: Preferences }` written atomically-ish to one
 * file. Good enough for local dev and a single long-lived Node process.
 *
 * NOT for production on an ephemeral serverless filesystem (e.g. Vercel), whose
 * disk is per-invocation, non-shared, and wiped between requests. There, swap this
 * for a durable backend (Postgres / Vercel KV) behind the `PreferencesStore`
 * interface — see the note in `store.ts` and `getPreferencesStore()`.
 */

/** The defaults returned for any user with no saved preferences. */
export const DEFAULT_PREFERENCES: Preferences = {
  defaultView: "mine",
  theme: "system",
  density: "comfortable",
  notifyDigest: false,
  notifyAlerts: false,
};

/**
 * Default on-disk location: a gitignored `data/` dir under the app root.
 * (`process.cwd()` is the app root for both `next` and `vitest`.)
 */
function defaultFilePath(): string {
  return join(process.cwd(), "data", "preferences.json");
}

type Db = Record<string, Preferences>;

export class JsonPreferencesStore implements PreferencesStore {
  private readonly file: string;

  constructor(file: string = defaultFilePath()) {
    this.file = file;
  }

  async get(userEmail: string): Promise<Preferences> {
    const db = this.read();
    const found = db[userEmail];
    // Always hand back a fresh object so callers can't mutate shared state.
    return { ...DEFAULT_PREFERENCES, ...found };
  }

  async set(userEmail: string, prefs: Preferences): Promise<void> {
    const db = this.read();
    db[userEmail] = { ...prefs };
    this.write(db);
  }

  /** Load the whole map; a missing/unreadable file reads as empty. */
  private read(): Db {
    let raw: string;
    try {
      raw = readFileSync(this.file, "utf8");
    } catch {
      // No file yet (or unreadable) → no saved prefs.
      return {};
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        return parsed as Db;
      }
      return {};
    } catch {
      // Corrupt JSON → treat as empty rather than crash a page.
      return {};
    }
  }

  /** Persist the whole map, creating the data dir on first write. */
  private write(db: Db): void {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(db, null, 2), "utf8");
  }
}
