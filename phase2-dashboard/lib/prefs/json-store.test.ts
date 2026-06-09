import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonPreferencesStore, DEFAULT_PREFERENCES } from "./json-store";

// Each test gets a throwaway temp file so cases never share state on disk.
let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "brava-prefs-"));
  file = join(dir, "preferences.json");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("JsonPreferencesStore", () => {
  it("returns the documented defaults on first read for an unknown user", async () => {
    const store = new JsonPreferencesStore(file);

    const prefs = await store.get("nobody@buildbrava.com");

    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  it("does not create the backing file just by reading defaults", async () => {
    const store = new JsonPreferencesStore(file);

    await store.get("nobody@buildbrava.com");

    expect(existsSync(file)).toBe(false);
  });

  it("round-trips a saved preference set through set() then get()", async () => {
    const store = new JsonPreferencesStore(file);
    const wanted: import("./store").Preferences = {
      defaultView: "all",
      theme: "dark",
      density: "compact",
      notifyDigest: true,
      notifyAlerts: false,
    };

    await store.set("joe@buildbrava.com", wanted);
    const got = await store.get("joe@buildbrava.com");

    expect(got).toEqual(wanted);
  });

  it("persists across store instances pointed at the same file", async () => {
    const wanted: import("./store").Preferences = {
      defaultView: "all",
      theme: "light",
      density: "compact",
      notifyDigest: false,
      notifyAlerts: true,
    };
    await new JsonPreferencesStore(file).set("joe@buildbrava.com", wanted);

    const reread = await new JsonPreferencesStore(file).get("joe@buildbrava.com");

    expect(reread).toEqual(wanted);
  });

  it("isolates preferences per user", async () => {
    const store = new JsonPreferencesStore(file);
    const joe: import("./store").Preferences = {
      defaultView: "all",
      theme: "dark",
      density: "compact",
      notifyDigest: true,
      notifyAlerts: true,
    };

    await store.set("joe@buildbrava.com", joe);

    // joe's write must not change anyone else's prefs
    expect(await store.get("amy@buildbrava.com")).toEqual(DEFAULT_PREFERENCES);
    // and a second user's write must not clobber joe's
    const amy: import("./store").Preferences = {
      defaultView: "mine",
      theme: "light",
      density: "comfortable",
      notifyDigest: false,
      notifyAlerts: false,
    };
    await store.set("amy@buildbrava.com", amy);
    expect(await store.get("joe@buildbrava.com")).toEqual(joe);
    expect(await store.get("amy@buildbrava.com")).toEqual(amy);
  });

  it("returns a defensive copy of defaults that callers cannot mutate", async () => {
    const store = new JsonPreferencesStore(file);

    const a = await store.get("nobody@buildbrava.com");
    a.theme = "dark";
    const b = await store.get("nobody@buildbrava.com");

    expect(b.theme).toBe(DEFAULT_PREFERENCES.theme);
  });

  it("overwrites a previously saved value on re-set", async () => {
    const store = new JsonPreferencesStore(file);
    const first: import("./store").Preferences = {
      defaultView: "mine",
      theme: "system",
      density: "comfortable",
      notifyDigest: false,
      notifyAlerts: false,
    };
    const second: import("./store").Preferences = {
      defaultView: "all",
      theme: "dark",
      density: "compact",
      notifyDigest: true,
      notifyAlerts: true,
    };

    await store.set("joe@buildbrava.com", first);
    await store.set("joe@buildbrava.com", second);

    expect(await store.get("joe@buildbrava.com")).toEqual(second);
  });
});
